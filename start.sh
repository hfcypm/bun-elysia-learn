#!/bin/bash

# Elysia Learning - 快速启动脚本

echo "🦊 Elysia.js 循序渐进学习项目"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    echo "下载地址：https://nodejs.org/"
    exit 1
fi

# 检查 tsx
if ! command -v tsx &> /dev/null; then
    echo "⚠️  未找到 tsx，正在全局安装..."
    npm install -g tsx
fi

# 显示菜单
echo "请选择要运行的案例："
echo ""
echo "Level 1 - 基础入门:"
echo "  1) Hello Elysia"
echo "  2) HTTP 方法与 CRUD"
echo ""
echo "Level 2 - 进阶技能:"
echo "  3) 请求验证"
echo "  4) 中间件系统"
echo "  8) 图片上传服务 (批量上传)"
echo ""
echo "Level 3 - 实战项目:"
echo "  5) 博客文章管理系统"
echo "  6) JWT 认证系统"
echo "  7) WebSocket 聊天室"
echo ""
echo "工具:"
echo "  0) 退出"
echo "  i) 安装依赖"
echo "  h) 查看帮助"
echo ""
read -p "请输入选项 (1-7, 0, i, h): " choice

case $choice in
    1)
        echo "🚀 启动案例 1: Hello Elysia"
        npx tsx watch src/basic/01-hello.ts
        ;;
    2)
        echo "🚀 启动案例 2: HTTP 方法与 CRUD"
        npx tsx watch src/basic/02-http-methods.ts
        ;;
    3)
        echo "🚀 启动案例 3: 请求验证"
        npx tsx watch src/intermediate/03-validation.ts
        ;;
    4)
        echo "🚀 启动案例 4: 中间件系统"
        npx tsx watch src/intermediate/04-middleware.ts
        ;;
    8)
        echo "🚀 启动案例 8: 图片上传服务"
        npx tsx watch src/intermediate/05-file-upload.ts
        ;;
    5)
        echo "🚀 启动案例 5: 博客文章管理系统"
        npx tsx watch src/advanced/05-blog-api.ts
        ;;
    6)
        echo "🚀 启动案例 6: JWT 认证系统"
        npx tsx watch src/advanced/06-auth.ts
        ;;
    7)
        echo "🚀 启动案例 7: WebSocket 聊天室"
        npx tsx watch src/advanced/07-websocket.ts
        ;;
    i|I)
        echo "📦 安装依赖..."
        npm install
        echo "✅ 安装完成"
        ;;
    h|H)
        echo "📖 帮助文档:"
        echo ""
        echo "README.md - 项目介绍"
        echo "docs/README.md - 学习指南"
        echo "docs/LEARNING_PATH.md - 学习路径"
        echo "docs/PRACTICE.md - 练习手册"
        echo "docs/QUICK_REFERENCE.md - 快速参考"
        echo "docs/INSTALLATION.md - 安装指南"
        echo ""
        ;;
    0)
        echo "👋 再见!"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
