#!/bin/bash

# 启动旧版文件上传服务 (src/02-intermediate/05-file-upload.ts)
# 使用方式：./start-old-upload.sh [dev|watch]

MODE=${1:-dev}

PORT=${2:-3007}

echo "📦 启动旧版文件上传服务..."
echo "📂 目录：$(pwd)"
echo "🔧 模式：$MODE"
echo "🌐 端口：$PORT"
echo ""

if [ "$MODE" = "watch" ]; then
  echo "✅ Watch 模式（自动重载）"
  bun run --watch src/02-intermediate/05-file-upload.ts
else
  echo "✅ 单次运行模式"
  bun run src/02-intermediate/05-file-upload.ts
fi
