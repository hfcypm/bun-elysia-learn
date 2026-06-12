#!/bin/bash

# 示例服务启动脚本
# 使用方式：./start-example.sh <服务名> [模式]

set -e

# 定义服务映射
declare -A SERVICES=(
    ["validation"]="src/02-intermediate/03-validation.ts"
    ["middleware"]="src/02-intermediate/04-middleware.ts"
    ["upload-old"]="src/02-intermediate/05-file-upload.ts"
    ["sqlite"]="src/02-intermediate/06-database-sqlite.ts"
    ["postgres"]="src/02-intermediate/07-database-postgres.ts"
    ["logging"]="src/02-intermediate/08-logging.ts"
    ["prisma"]="src/02-intermediate/08-prisma-orm.ts"
)

# 端口映射
declare -A PORTS=(
    ["validation"]=3002
    ["middleware"]=3003
    ["upload-old"]=3007
    ["sqlite"]=3008
    ["postgres"]=3009
    ["logging"]=3010
    ["prisma"]=3011
)

# 显示使用帮助
show_help() {
    echo "🚀 示例服务启动脚本"
    echo ""
    echo "使用方式：./start-example.sh <服务名> [模式]"
    echo ""
    echo "可用服务:"
    echo "  validation  - 数据验证 (Port ${PORTS[validation]})"
    echo "  middleware  - 中间件 (Port ${PORTS[middleware]})"
    echo "  upload-old  - 旧版上传 (Port ${PORTS[upload-old]})"
    echo "  sqlite      - SQLite数据库 (Port ${PORTS[sqlite]})"
    echo "  postgres    - PostgreSQL (Port ${PORTS[postgres]})"
    echo "  logging     - 日志系统 (Port ${PORTS[logging]})"
    echo "  prisma      - Prisma ORM (Port ${PORTS[prisma]})"
    echo ""
    echo "模式:"
    echo "  watch   - Watch 模式（自动重载，推荐）"
    echo "  normal  - 普通模式（默认）"
    echo ""
    echo "示例:"
    echo "  ./start-example.sh validation watch"
    echo "  ./start-example.sh middleware"
    echo "  ./start-example.sh all  - 显示所有服务状态"
    exit 0
}

# 显示所有服务状态
show_status() {
    echo "📊 服务状态概览"
    echo ""
    for service in "${!SERVICES[@]}"; do
        port=${PORTS[$service]}
        if lsof -i :$port > /dev/null 2>&1; then
            echo "✅ $service - Port $port - 运行中"
        else
            echo "❌ $service - Port $port - 未运行"
        fi
    done
    echo ""
    echo "Monorepo 服务:"
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "✅ frontend - Port 3000 - 运行中"
    else
        echo "❌ frontend - Port 3000 - 未运行"
    fi
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "✅ backend - Port 3001 - 运行中"
    else
        echo "❌ backend - Port 3001 - 未运行"
    fi
}

# 启动服务
start_service() {
    local service_name=$1
    local mode=$2
    local file=${SERVICES[$service_name]}
    local port=${PORTS[$service_name]}
    
    if [ ! -f "$file" ]; then
        echo "❌ 文件不存在：$file"
        exit 1
    fi
    
    echo "🚀 启动 $service_name 服务..."
    echo "📂 文件：$file"
    echo "🌐 端口：$port"
    echo "🔧 模式：$mode"
    echo ""
    
    if [ "$mode" = "watch" ]; then
        bun run --watch "$file"
    else
        bun run "$file"
    fi
}

# 主逻辑
if [ $# -eq 0 ]; then
    show_help
fi

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
fi

if [ "$1" = "all" ]; then
    show_status
    exit 0
fi

SERVICE_NAME=$1
MODE=${2:-normal}  # 默认普通模式

# 检查服务是否存在
if [ -z "${SERVICES[$SERVICE_NAME]}" ]; then
    echo "❌ 未知服务：$SERVICE_NAME"
    echo ""
    echo "使用 ./start-example.sh --help 查看可用服务"
    exit 1
fi

# 检查端口是否被占用
PORT=${PORTS[$SERVICE_NAME]}
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "   可能已有 $SERVICE_NAME 服务在运行"
    echo ""
    echo "选项:"
    echo "  1. 停止现有服务：kill -\$(lsof -t -i:$PORT)"
    echo "  2. 查看进程：ps aux | grep $PORT"
    echo ""
    read -p "是否继续？(这将导致端口冲突) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动服务
start_service "$SERVICE_NAME" "$MODE"
