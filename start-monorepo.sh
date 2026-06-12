#!/bin/bash

echo "🚀 同时启动前后端服务..."
echo ""

# 启动后端
echo "📦 启动后端服务 (Port 3001)..."
bun run --filter backend dev &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务 (Port 3000)..."
bun run --filter frontend dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动!"
echo "   前端：http://localhost:3000"
echo "   后端: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
