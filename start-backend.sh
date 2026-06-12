#!/bin/bash

# 启动后端服务 (apps/backend)
# 使用方式：./start-backend.sh [dev|start|watch]

MODE=${1:-dev}

cd "$(dirname "$0")/apps/backend"

echo "🚀 启动后端服务..."
echo "📂 目录：$(pwd)"
echo "🔧 模式：$MODE"
echo "🌐 端口：3001"
echo "📚 Swagger: http://localhost:3001/swagger"
echo ""

case $MODE in
  dev)
    echo "✅ 开发模式（热重载）"
    bun run dev
    ;;
  start)
    echo "✅ 生产模式"
    bun run start
    ;;
  watch)
    echo "✅ Watch 模式"
    bun run --watch src/index.ts
    ;;
  *)
    echo "❌ 未知模式：$MODE"
    echo "可用模式：dev, start, watch"
    exit 1
    ;;
esac
