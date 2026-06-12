#!/bin/bash

# 启动前端服务 (apps/frontend)
# 使用方式：./start-frontend.sh [dev|build|preview]

MODE=${1:-dev}

cd "$(dirname "$0")/apps/frontend"

echo "🎨 启动前端服务..."
echo "📂 目录：$(pwd)"
echo "🔧 模式：$MODE"
echo "🌐 端口：3000"
echo ""

case $MODE in
  dev)
    echo "✅ 开发模式（Vite HMR）"
    bun run dev
    ;;
  build)
    echo "✅ 构建生产版本"
    bun run build
    ;;
  preview)
    echo "✅ 预览构建结果"
    bun run preview
    ;;
  *)
    echo "❌ 未知模式：$MODE"
    echo "可用模式：dev, build, preview"
    exit 1
    ;;
esac
