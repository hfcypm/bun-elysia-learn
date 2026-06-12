#!/bin/bash

# 停止所有 Bun 服务

echo "🛑 停止所有 Bun 服务..."
echo ""

# 查找所有 bun 进程
PIDS=$(pgrep -f "^bun run")

if [ -z "$PIDS" ]; then
    echo "ℹ️  没有运行的 Bun 服务"
    exit 0
fi

echo "找到以下进程:"
ps -p $PIDS -o pid,cmd | head -20
echo ""

# 确认停止
read -p "确定要停止这些服务吗？[y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 停止进程
for PID in $PIDS; do
    echo "停止进程 $PID..."
    kill $PID 2>/dev/null || true
done

# 等待进程结束
sleep 2

# 检查是否还有残留
REMAINING=$(pgrep -f "^bun run")
if [ -z "$REMAINING" ]; then
    echo ""
    echo "✅ 所有 Bun 服务已停止"
else
    echo ""
    echo "⚠️  以下进程未能正常停止:"
    ps -p $REMAINING -o pid,cmd
    echo ""
    read -p "是否强制终止？[y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for PID in $REMAINING; do
            kill -9 $PID 2>/dev/null || true
        done
        echo "✅ 已强制终止所有进程"
    fi
fi
