#!/bin/bash

# 智能AI聊天系统启动脚本

echo "🚀 启动智能AI聊天系统..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 创建日志目录
mkdir -p logs

echo "📦 安装后端依赖..."
cd backend

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装Python依赖
pip install -r requirements.txt

echo "🔧 检查环境配置..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，请创建并配置API密钥"
    echo "参考 .env.example 文件进行配置"
    exit 1
fi

echo "🌐 启动后端服务..."
# 后台启动后端服务
nohup python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动，PID: $BACKEND_PID"

# 等待后端服务启动
sleep 3

# 检查后端服务是否正常启动
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，请检查日志: logs/backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "📦 安装前端依赖..."
cd ../frontend

# 安装Node.js依赖
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🎨 启动前端服务..."
# 后台启动前端服务
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动，PID: $FRONTEND_PID"

# 保存PID到文件
echo $BACKEND_PID > ../logs/backend.pid
echo $FRONTEND_PID > ../logs/frontend.pid

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📍 访问地址："
echo "   前端界面: http://localhost:3000"
echo "   后端API:  http://localhost:8000"
echo "   API文档:  http://localhost:8000/docs"
echo ""
echo "📋 管理命令："
echo "   查看日志: tail -f logs/backend.log 或 tail -f logs/frontend.log"
echo "   停止服务: ./stop.sh"
echo ""
echo "💡 提示：首次使用请确保已在 backend/.env 中配置正确的API密钥"

# 等待用户输入以保持脚本运行
echo "按 Ctrl+C 停止所有服务..."
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done
