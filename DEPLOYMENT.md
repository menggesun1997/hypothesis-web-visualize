# 科研假设可视化分析系统 - 部署指南

## 🚀 系统概述

这是一个基于Flask的科研假设可视化分析系统，提供假设浏览、筛选、排序和详情查看功能。

## 📁 项目结构

```
hypothesis_web_visualize/
├── app_enhanced.py          # 主Flask应用
├── requirements.txt          # Python依赖
├── Procfile                 # Railway部署配置
├── start_enhanced_app.sh    # 启动脚本
├── templates/               # HTML模板
│   ├── index.html          # 主页面
│   └── sorting.html        # 排序筛选页面
├── static/                  # 静态资源
│   ├── css/                # 样式文件
│   │   ├── style.css       # 主页面样式
│   │   └── sorting.css     # 排序页面样式
│   └── js/                 # JavaScript文件
│       ├── app_enhanced.js # 主页面逻辑
│       └── sorting.js      # 排序页面逻辑
└── hypothesis_data.db       # SQLite数据库
```

## 🔧 安装步骤

### 1. 环境要求
- Python 3.8+
- pip

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 启动应用
```bash
# 开发环境
python app_enhanced.py

# 生产环境
gunicorn -w 4 -b 0.0.0.0:8080 app_enhanced:app
```

## 🌐 访问地址

- **主页面**: `http://localhost:8080/`
- **排序筛选**: `http://localhost:8080/sorting`

## 📊 主要功能

### 主页面功能
- 主题导航和子主题浏览
- 策略筛选（evolve, high_impact, similar）
- 假设详情查看
- 分数展示和分析

### 排序筛选功能
- 多维度排序（分数、时间等）
- 策略筛选
- 显示数量控制
- 假设详情模态框

## 🗄️ 数据库

系统使用SQLite数据库，包含以下主要表：
- `hypothesis`: 假设数据
- `literature_agent`: 文献代理信息
- `analyzer_analysis`: 分析结果

## 🚀 部署到Railway

1. 确保`Procfile`存在
2. 连接GitHub仓库到Railway
3. 自动部署

## 🔍 故障排除

### 常见问题
1. **端口占用**: 修改`app_enhanced.py`中的端口号
2. **数据库连接**: 确保`hypothesis_data.db`文件存在
3. **依赖问题**: 重新安装`requirements.txt`

### 日志查看
```bash
# 查看Flask应用日志
tail -f app.log

# 查看系统日志
journalctl -u hypothesis-web -f
```

## 📝 更新日志

- **v1.0.0**: 初始版本，包含基本功能
- **v1.1.0**: 添加排序筛选页面
- **v1.2.0**: 优化UI/UX，修复显示问题

## 📞 技术支持

如有问题，请检查：
1. 控制台错误信息
2. 网络请求状态
3. 数据库连接状态
