#!/bin/bash

echo "========================================="
echo "🎯 无限赏监控系统启动脚本"
echo "========================================="

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python"
    exit 1
fi

echo "✅ Python版本: $(python3 --version)"

# 安装依赖
echo ""
echo "📦 安装依赖包..."
pip3 install -r requirements.txt

# 启动后端服务
echo ""
echo "🚀 启动后端服务..."
cd backend
python3 app.py
