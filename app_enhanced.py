#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版科研假设可视化Flask应用
支持高级搜索、动态排序、智能筛选和数据分析
"""

import sqlite3
import json
from datetime import datetime
from flask import Flask, render_template, jsonify, request
import os
from pathlib import Path

app = Flask(__name__)

# 数据库配置
DATABASE = 'hypothesis_data.db'

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """初始化数据库连接"""
    if not os.path.exists(DATABASE):
        print(f"❌ 数据库文件 {DATABASE} 不存在，请先运行数据库创建脚本")
        return False
    return True

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

@app.route('/sorting')
def sorting():
    """排序筛选页面"""
    return render_template('sorting.html')

@app.route('/api/statistics')
def get_statistics():
    """获取统计信息"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 基础统计
        cursor.execute('SELECT COUNT(DISTINCT topic) as total_topics FROM hypothesis')
        total_topics = cursor.fetchone()['total_topics']
        
        cursor.execute('SELECT COUNT(DISTINCT sub_topic) as total_subtopics FROM hypothesis')
        total_subtopics = cursor.fetchone()['total_subtopics']
        
        cursor.execute('SELECT COUNT(*) as total_hypotheses FROM hypothesis')
        total_hypotheses = cursor.fetchone()['total_hypotheses']
        
        # 策略分布
        cursor.execute('''
            SELECT strategy, COUNT(*) as count 
            FROM hypothesis 
            GROUP BY strategy
        ''')
        strategy_distribution = {row['strategy']: row['count'] for row in cursor.fetchall()}
        
        # 评分统计
        cursor.execute('''
            SELECT 
                AVG(novelty_score) as avg_novelty,
                AVG(significance_score) as avg_significance,
                AVG(soundness_score) as avg_soundness,
                AVG(feasibility_score) as avg_feasibility,
                AVG(overall_winner_score) as avg_overall
            FROM hypothesis 
            WHERE overall_winner_score IS NOT NULL
        ''')
        score_stats = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'total_topics': total_topics,
            'total_subtopics': total_subtopics,
            'total_hypotheses': total_hypotheses,
            'strategy_distribution': strategy_distribution,
            'score_statistics': {
                'novelty': round(score_stats['avg_novelty'], 2) if score_stats['avg_novelty'] else 0,
                'significance': round(score_stats['avg_significance'], 2) if score_stats['avg_significance'] else 0,
                'soundness': round(score_stats['avg_soundness'], 2) if score_stats['avg_soundness'] else 0,
                'feasibility': round(score_stats['avg_feasibility'], 2) if score_stats['avg_feasibility'] else 0,
                'overall': round(score_stats['avg_overall'], 2) if score_stats['avg_overall'] else 0
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/topics')
def get_topics():
    """获取所有主题"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 修复：使用正确的列名和查询
        cursor.execute('''
            SELECT DISTINCT topic_id, topic_title, topic_category 
            FROM literature_agent 
            ORDER BY topic_id
        ''')
        
        topics = []
        for row in cursor.fetchall():
            topics.append({
                'id': row['topic_id'],
                'title': row['topic_title'],
                'category': row['topic_category']
            })
        
        conn.close()
        return jsonify(topics)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subtopics/<int:topic_id>')
def get_subtopics(topic_id):
    """获取指定主题的子主题"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT sub_topic, description, search_queries 
            FROM literature_agent 
            WHERE topic_id = ? 
            ORDER BY sub_topic
        ''', (topic_id,))
        
        subtopics = []
        for row in cursor.fetchall():
            subtopics.append({
                'title': row['sub_topic'],
                'description': row['description'],
                'search_queries': row['search_queries']
            })
        
        conn.close()
        return jsonify(subtopics)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:topic_id>/<int:subtopic_index>')
def get_categories(topic_id, subtopic_index):
    """获取指定子主题的类别"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取子主题的文本描述
        cursor.execute('''
            SELECT sub_topic FROM literature_agent 
            WHERE topic_id = ? 
            ORDER BY sub_topic
            LIMIT 1 OFFSET ?
        ''', (topic_id, subtopic_index))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify([])
        
        # 使用数字索引查询analyzer_agent表
        numeric_subtopic = f"sub_topic_{subtopic_index}"
        
        cursor.execute('''
            SELECT DISTINCT literature_category, COUNT(*) as hypothesis_count
            FROM analyzer_agent 
            WHERE topic = ? AND sub_topic = ?
            GROUP BY literature_category
            ORDER BY literature_category
        ''', (topic_id, numeric_subtopic))
        
        categories = []
        for row in cursor.fetchall():
            categories.append({
                'name': row['literature_category'],
                'hypothesis_count': row['hypothesis_count']
            })
        
        conn.close()
        return jsonify(categories)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hypotheses')
def get_hypotheses():
    """高级假设查询API"""
    try:
        # 获取查询参数
        topic = request.args.get('topic', type=int)
        subtopic = request.args.get('subtopic', type=int)
        category = request.args.get('category')
        strategies = request.args.getlist('strategy')  # 获取多个策略参数
        search = request.args.get('search', '').strip()
        
        # 添加调试信息
        print(f"🔍 接收到的策略参数: {strategies}")
        print(f"🔍 策略参数类型: {type(strategies)}")
        print(f"🔍 策略参数长度: {len(strategies) if strategies else 0}")
        
        # 排序参数
        sort_by = request.args.get('sort_by', 'overall_winner_score')
        sort_order = request.args.get('sort_order', 'desc')
        
        # 评分筛选
        min_score = request.args.get('min_score', type=float)
        max_score = request.args.get('max_score', type=float)
        score_type = request.args.get('score_type', 'overall_winner_score')
        
        # 分页参数
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 构建查询SQL
        query = '''
            SELECT 
                h.id,
                h.topic,
                h.sub_topic,
                h.strategy,
                h.hypothesis_id,
                h.hypothesis_content,
                h.feedback_results,
                h.novelty_score,
                h.significance_score,
                h.soundness_score,
                h.feasibility_score,
                h.overall_winner_score,
                h.created_at
            FROM hypothesis h
        '''
        
        # 动态构建WHERE子句
        where_conditions = []
        
        params = []
        
        # 添加筛选条件
        if topic and topic != 'undefined':
            where_conditions.append('h.topic = ?')
            params.append(topic)
        
        if subtopic is not None and subtopic != 'undefined':
            where_conditions.append('h.sub_topic = ?')
            params.append(subtopic)
        
        # 处理多策略筛选
        if strategies and len(strategies) > 0:
            # 过滤掉无效的策略值
            valid_strategies = [s for s in strategies if s and s != 'undefined' and s != '']
            print(f"🔍 有效策略: {valid_strategies}")
            if valid_strategies:
                placeholders = ','.join(['?' for _ in valid_strategies])
                where_conditions.append(f'h.strategy IN ({placeholders})')
                params.extend(valid_strategies)
                print(f"🔍 添加策略筛选: {where_conditions}")
                print(f"🔍 策略参数: {params}")
        
        if search:
            where_conditions.append('(h.hypothesis_content LIKE ? OR h.feedback_results LIKE ?)')
            params.extend([f'%{search}%', f'%{search}%'])
        
        if min_score is not None:
            where_conditions.append(f'h.{score_type} >= ?')
            params.append(min_score)
        
        if max_score is not None:
            where_conditions.append(f'h.{score_type} <= ?')
            params.append(max_score)
        
        # 添加WHERE子句（如果有条件的话）
        if where_conditions:
            query += ' WHERE ' + ' AND '.join(where_conditions)
        
        # 添加排序
        query += f' ORDER BY h.{sort_by} {sort_order.upper()}'
        
        # 添加分页
        query += ' LIMIT ? OFFSET ?'
        params.extend([per_page, (page - 1) * per_page])
        
        print(f"🔍 最终SQL查询: {query}")
        print(f"🔍 最终参数: {params}")
        
        # 执行查询
        cursor.execute(query, params)
        hypotheses = []
        
        for row in cursor.fetchall():
            hypotheses.append({
                'id': row['id'],
                'topic': row['topic'],
                'sub_topic': row['sub_topic'],
                'strategy': row['strategy'],
                'hypothesis_id': row['hypothesis_id'],
                'hypothesis_content': row['hypothesis_content'],
                'feedback_results': row['feedback_results'],
                'scores': {
                    'novelty': row['novelty_score'],
                    'significance': row['significance_score'],
                    'soundness': row['soundness_score'],
                    'feasibility': row['feasibility_score'],
                    'overall_winner': row['overall_winner_score']
                },
                'created_at': row['created_at']
            })
        
        print(f"🔍 查询结果数量: {len(hypotheses)}")
        
        # 获取总数 - 修复SQL查询
        count_query = query.replace('SELECT \n                h.id,\n                h.topic,\n                h.sub_topic,\n                h.strategy,\n                h.hypothesis_id,\n                h.hypothesis_content,\n                h.feedback_results,\n                h.novelty_score,\n                h.significance_score,\n                h.soundness_score,\n                h.feasibility_score,\n                h.overall_winner_score,\n                h.created_at', 'SELECT COUNT(*)')
        
        # 移除排序和分页部分
        count_query = count_query.split(' ORDER BY ')[0]
        
        # 移除分页参数（如果有的话）
        count_params = params[:-2] if len(params) >= 2 and 'LIMIT' in query else params
        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'hypotheses': hypotheses,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        print(f"❌ 查询错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/advanced_search')
def advanced_search():
    """高级搜索API"""
    try:
        # 获取搜索参数
        search_type = request.args.get('type', 'all')  # all, content, feedback, scores
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'error': '搜索查询不能为空'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if search_type == 'scores':
            # 按评分搜索
            try:
                score_value = float(query)
                cursor.execute('''
                    SELECT id, topic, sub_topic, strategy, hypothesis_id,
                           novelty_score, significance_score, soundness_score, 
                           feasibility_score, overall_winner_score
                    FROM hypothesis 
                    WHERE novelty_score >= ? OR significance_score >= ? OR 
                          soundness_score >= ? OR feasibility_score >= ? OR 
                          overall_winner_score >= ?
                    ORDER BY overall_winner_score DESC
                    LIMIT 50
                ''', (score_value, score_value, score_value, score_value, score_value))
            except ValueError:
                return jsonify({'error': '评分搜索需要数字值'}), 400
        else:
            # 按内容搜索
            if search_type == 'content':
                sql = '''
                    SELECT id, topic, sub_topic, strategy, hypothesis_id,
                           hypothesis_content, overall_winner_score
                    FROM hypothesis 
                    WHERE hypothesis_content LIKE ?
                    ORDER BY overall_winner_score DESC
                    LIMIT 50
                '''
            elif search_type == 'feedback':
                sql = '''
                    SELECT id, topic, sub_topic, strategy, hypothesis_id,
                           feedback_results, overall_winner_score
                    FROM hypothesis 
                    WHERE feedback_results LIKE ?
                    ORDER BY overall_winner_score DESC
                    LIMIT 50
                '''
            else:  # all
                sql = '''
                    SELECT id, topic, sub_topic, strategy, hypothesis_id,
                           hypothesis_content, feedback_results, overall_winner_score
                    FROM hypothesis 
                    WHERE hypothesis_content LIKE ? OR feedback_results LIKE ?
                    ORDER BY overall_winner_score DESC
                    LIMIT 50
                '''
            
            if search_type == 'all':
                cursor.execute(sql, [f'%{query}%', f'%{query}%'])
            else:
                cursor.execute(sql, [f'%{query}%'])
        
        results = []
        for row in cursor.fetchall():
            result = {
                'id': row['id'],
                'topic': row['topic'],
                'sub_topic': row['sub_topic'],
                'strategy': row['strategy'],
                'hypothesis_id': row['hypothesis_id'],
                'overall_score': row['overall_winner_score']
            }
            
            if search_type in ['content', 'all'] and 'hypothesis_content' in row.keys():
                result['content'] = row['hypothesis_content']
            if search_type in ['feedback', 'all'] and 'feedback_results' in row.keys():
                result['feedback'] = row['feedback_results']
            if search_type == 'scores':
                result['scores'] = {
                    'novelty': row['novelty_score'],
                    'significance': row['significance_score'],
                    'soundness': row['soundness_score'],
                    'feasibility': row['feasibility_score'],
                    'overall_winner': row['overall_winner_score']
                }
            
            results.append(result)
        
        conn.close()
        return jsonify({'results': results, 'query': query, 'type': search_type})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/score_distribution')
def get_score_distribution():
    """获取评分分布分析"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 评分分布
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN overall_winner_score >= 8 THEN '优秀 (8-10)'
                    WHEN overall_winner_score >= 6 THEN '良好 (6-8)'
                    WHEN overall_winner_score >= 4 THEN '一般 (4-6)'
                    ELSE '较差 (0-4)'
                END as score_range,
                COUNT(*) as count
            FROM hypothesis 
            WHERE overall_winner_score IS NOT NULL
            GROUP BY 
                CASE 
                    WHEN overall_winner_score >= 8 THEN '优秀 (8-10)'
                    WHEN overall_winner_score >= 6 THEN '良好 (6-8)'
                    WHEN overall_winner_score >= 4 THEN '一般 (4-6)'
                    ELSE '较差 (0-4)'
                END
            ORDER BY 
                CASE score_range
                    WHEN '优秀 (8-10)' THEN 1
                    WHEN '良好 (6-8)' THEN 2
                    WHEN '一般 (4-6)' THEN 3
                    ELSE 4
                END
        ''')
        
        distribution = [{'range': row['score_range'], 'count': row['count']} for row in cursor.fetchall()]
        
        # 策略对比
        cursor.execute('''
            SELECT 
                strategy,
                AVG(novelty_score) as avg_novelty,
                AVG(significance_score) as avg_significance,
                AVG(soundness_score) as avg_soundness,
                AVG(feasibility_score) as avg_feasibility,
                AVG(overall_winner_score) as avg_overall
            FROM hypothesis 
            WHERE overall_winner_score IS NOT NULL
            GROUP BY strategy
        ''')
        
        strategy_comparison = []
        for row in cursor.fetchall():
            strategy_comparison.append({
                'strategy': row['strategy'],
                'scores': {
                    'novelty': round(row['avg_novelty'], 2),
                    'significance': round(row['avg_significance'], 2),
                    'soundness': round(row['avg_soundness'], 2),
                    'feasibility': round(row['avg_feasibility'], 2),
                    'overall': round(row['avg_overall'], 2)
                }
            })
        
        conn.close()
        
        return jsonify({
            'distribution': distribution,
            'strategy_comparison': strategy_comparison
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/analytics/top_hypotheses')
def get_top_hypotheses():
    """获取TOP假设"""
    try:
        limit = request.args.get('limit', 20, type=int)
        score_type = request.args.get('score_type', 'overall_winner_score')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f'''
            SELECT 
                h.id, h.topic, h.sub_topic, h.strategy, h.hypothesis_id,
                h.hypothesis_content, h.overall_winner_score,
                la.sub_topic as subtopic_title
            FROM hypothesis h
            LEFT JOIN literature_agent la ON h.topic = la.topic_id AND h.sub_topic = la.sub_topic
            WHERE h.{score_type} IS NOT NULL
            ORDER BY h.{score_type} DESC
            LIMIT ?
        ''', (limit,))
        
        top_hypotheses = []
        for row in cursor.fetchall():
            top_hypotheses.append({
                'id': row['id'],
                'topic': row['topic'],
                'sub_topic': row['sub_topic'],
                'subtopic_title': row['subtopic_title'],
                'strategy': row['strategy'],
                'hypothesis_id': row['hypothesis_id'],
                'content_preview': row['hypothesis_content'][:200] + '...' if row['hypothesis_content'] else '',
                'overall_score': row['overall_winner_score']
            })
        
        conn.close()
        return jsonify(top_hypotheses)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hypothesis/<int:hypothesis_id>')
def get_hypothesis(hypothesis_id):
    """获取单个假设的详细信息"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                h.id,
                h.topic,
                h.sub_topic,
                h.strategy,
                h.hypothesis_id,
                h.hypothesis_content,
                h.feedback_results,
                h.novelty_score,
                h.significance_score,
                h.soundness_score,
                h.feasibility_score,
                h.overall_winner_score,
                h.created_at
            FROM hypothesis h
            WHERE h.id = ? OR h.hypothesis_id = ?
        ''', (hypothesis_id, hypothesis_id))
        
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return jsonify({'error': '假设不存在'}), 404
        
        hypothesis = {
            'id': row['id'],
            'topic': row['topic'],
            'sub_topic': row['sub_topic'],
            'strategy': row['strategy'],
            'hypothesis_id': row['hypothesis_id'],
            'hypothesis_content': row['hypothesis_content'],
            'feedback_results': row['feedback_results'],
            'novelty_score': row['novelty_score'],
            'significance_score': row['significance_score'],
            'soundness_score': row['soundness_score'],
            'feasibility_score': row['feasibility_score'],
            'overall_winner_score': row['overall_winner_score'],
            'created_at': row['created_at']
        }
        
        return jsonify(hypothesis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyzer_analysis/<int:topic_id>/<int:subtopic_index>')
def get_analyzer_analysis(topic_id, subtopic_index):
    """获取analyzer_agent表中的current_analysis数据"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 首先获取该topic下的所有analyzer_agent记录
        cursor.execute('''
            SELECT current_analysis 
            FROM analyzer_agent 
            WHERE topic = ?
            ORDER BY id
        ''', (topic_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        # 根据subtopic_index选择对应的记录
        if results and subtopic_index < len(results):
            result = results[subtopic_index]
            return jsonify({
                'topic': topic_id,
                'subtopic_index': subtopic_index,
                'current_analysis': result[0]
            })
        else:
            return jsonify({
                'topic': topic_id,
                'subtopic_index': subtopic_index,
                'current_analysis': None
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/literature_agent/<int:topic_id>/<int:subtopic_index>')
def get_literature_agent(topic_id, subtopic_index):
    """获取literature_agent表中的description和search_queries数据"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 首先获取该topic下的所有literature_agent记录
        cursor.execute('''
            SELECT topic_title, topic_category, sub_topic, description, search_queries, model_source
            FROM literature_agent 
            WHERE topic_id = ?
            ORDER BY id
        ''', (topic_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        # 根据subtopic_index选择对应的记录
        if results and subtopic_index < len(results):
            result = results[subtopic_index]
            return jsonify({
                'topic_id': topic_id,
                'subtopic_index': subtopic_index,
                'topic_title': result[0],
                'topic_category': result[1],
                'sub_topic': result[2],
                'description': result[3],
                'search_queries': result[4],
                'model_source': result[5]
            })
        else:
            return jsonify({
                'topic_id': topic_id,
                'subtopic_index': subtopic_index,
                'topic_title': None,
                'topic_category': None,
                'sub_topic': None,
                'description': None,
                'search_queries': None,
                'model_source': None
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if not init_database():
        print("❌ 数据库初始化失败")
        exit(1)
    
    print("🚀 启动增强版Flask应用...")
    print("📊 支持高级搜索、动态排序、智能筛选和数据分析")
    print("🌐 访问地址: http://localhost:8080")
    
    app.run(debug=True, host='0.0.0.0', port=8080)
