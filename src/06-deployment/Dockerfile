# 使用 Bun 的 Elysia.js 应用 Dockerfile

# 阶段 1: 构建阶段
FROM oven/bun:1 AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json bun.lockb ./

# 安装所有依赖 (包括开发依赖)
RUN bun install

# 复制源代码
COPY . .

# 构建应用 (如果需要)
# RUN bun build src/advanced/bookmark-system.ts --outdir dist --minify --target bun

# 阶段 2: 生产阶段
FROM oven/bun:1 AS runner

WORKDIR /app

# 设置运行环境
ENV NODE_ENV=production
ENV PORT=3000

# 复制 package.json 和 lock 文件
COPY package.json bun.lockb ./

# 只安装生产依赖
RUN bun install --production

# 从构建阶段复制源代码
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docs ./docs

# 或者复制构建后的文件
# COPY --from=builder /app/dist ./dist

# 创建非 root 用户运行应用
RUN adduser --system --uid 1001 bunuser
RUN chown -R bunuser:bunuser /app
USER bunuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run src/deployment/03-health-check.ts || exit 1

# 启动应用
CMD ["bun", "run", "src/advanced/bookmark-system.ts"]

# ==================== 说明 ====================
#
# 构建镜像:
# docker build -t elysia-app .
#
# 运行容器:
# docker run -p 3000:3000 --name elysia-app elysia-app
#
# 后台运行:
# docker run -d -p 3000:3000 --name elysia-app elysia-app
#
# 查看日志:
# docker logs -f elysia-app
#
# 进入容器:
# docker exec -it elysia-app /bin/bash
#
# 停止容器:
# docker stop elysia-app
#
# 删除容器:
# docker rm elysia-app
#
# 使用环境变量:
# docker run -p 3000:3000 \
#   -e DATABASE_URL="file:/app/data/dev.db" \
#   -e JWT_SECRET="your-secret-key" \
#   elysia-app
#
# ==================== 多阶段构建优势 ====================
#
# 1. 更小的镜像体积 (只包含生产依赖)
# 2. 更好的安全性 (使用非 root 用户)
# 3. 更快的构建速度 (利用缓存)
# 4. 分离构建和运行环境
#
# ==================== 优化建议 ====================
#
# 1. 使用 .dockerignore 排除不必要的文件
# 2. 使用多阶段构建减小镜像大小
# 3. 使用非 root 用户运行
# 4. 添加健康检查
# 5. 使用环境变量管理配置
