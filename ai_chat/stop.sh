#!/bin/bash

# 智能AI聊天系统停止脚本

echo "🛑 停止智能AI聊天系统..."

# 读取PID文件并停止服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        # 强制停止（如果需要）
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID
        fi
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务未运行"
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        # 强制停止（如果需要）
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID
        fi
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务未运行"
    fi
    rm -f logs/frontend.pid
fi

# 额外清理：停止可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "python main.py" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ 所有服务已停止"
