#!/bin/bash

# 增强版科研假设可视化系统启动脚本

echo "🚀 启动增强版科研假设可视化系统..."
echo "=================================="

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 虚拟环境不存在，正在创建..."
    python3 -m venv venv
    echo "✅ 虚拟环境创建完成"
fi

# 激活虚拟环境
echo "🔄 激活虚拟环境..."
source venv/bin/activate

# 检查并安装依赖
echo "📦 检查依赖..."
if ! pip show flask > /dev/null 2>&1; then
    echo "🔄 安装Flask..."
    pip install flask
fi

if ! pip show pandas > /dev/null 2>&1; then
    echo "🔄 安装pandas..."
    pip install pandas
fi

if ! pip show openpyxl > /dev/null 2>&1; then
    echo "🔄 安装openpyxl..."
    pip install openpyxl
fi

# 检查数据库文件
if [ ! -f "hypothesis_data.db" ]; then
    echo "❌ 数据库文件不存在！"
    echo "请先运行数据库创建脚本："
    echo "python3 recreate_hypothesis_table.py"
    echo ""
    echo "或者检查以下文件是否存在："
    echo "- hypothesis_data.db"
    echo "- literature_agent 表"
    echo "- analyzer_agent 表"
    echo "- hypothesis 表"
    exit 1
fi

# 检查数据库表
echo "🔍 检查数据库表..."
python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('hypothesis_data.db')
    cursor = conn.cursor()
    
    tables = ['literature_agent', 'analyzer_agent', 'hypothesis']
    for table in tables:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f'✅ {table} 表: {count} 条记录')
    
    conn.close()
    print('✅ 数据库检查完成')
except Exception as e:
    print(f'❌ 数据库检查失败: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ 数据库检查失败，请检查数据库文件"
    exit 1
fi

echo ""
echo "🌐 启动Flask应用..."
echo "📊 功能特性："
echo "   - 高级搜索和筛选"
echo "   - 动态排序和分页"
echo "   - 智能数据分析"
echo "   - 图表可视化"
echo "   - CSV导出功能"
echo ""
echo "🚀 应用将在 http://localhost:8080 启动"
echo "按 Ctrl+C 停止应用"
echo ""

# 启动应用
python3 app_enhanced.py
