# Elysia.js 部署指南

> 从开发到生产的完整部署流程

---

## 📋 目录

1. [部署方式总览](#部署方式总览)
2. [Docker 部署](#docker-部署)
3. [Docker Compose 部署](#docker-compose-部署)
4. [PM2 部署](#pm2-部署)
5. [云平台部署](#云平台部署)
6. [健康检查](#健康检查)
7. [环境变量管理](#环境变量管理)
8. [日志管理](#日志管理)
9. [性能优化](#性能优化)
10. [故障排查](#故障排查)

---

## 部署方式总览

| 部署方式 | 适用场景 | 复杂度 | 推荐度 |
|----------|----------|--------|--------|
| **Docker** | 生产环境、微服务 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Docker Compose** | 多服务编排 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **PM2** | 传统服务器、Node.js 环境 | ⭐⭐ | ⭐⭐⭐⭐ |
| **VPS 直接部署** | 小型项目、个人项目 | ⭐⭐ | ⭐⭐⭐ |
| **云平台 (Vercel/Railway)** | 快速部署、自动扩展 | ⭐⭐ | ⭐⭐⭐⭐ |

---

## Docker 部署

### 前置准备

1. 安装 Docker: https://docs.docker.com/get-docker/
2. 确保项目包含 `Dockerfile`

### 构建镜像

```bash
# 方式 1: 使用默认 Dockerfile
docker build -t elysia-app .

# 方式 2: 指定 Dockerfile 路径
docker build -f src/deployment/Dockerfile -t elysia-app .

# 方式 3: 多架构构建
docker buildx build --platform linux/amd64,linux/arm64 -t elysia-app .
```

### 运行容器

```bash
# 基础运行
docker run -p 3000:3000 --name elysia-app elysia-app

# 后台运行
docker run -d -p 3000:3000 --name elysia-app elysia-app

# 使用环境变量
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -e JWT_SECRET="your-secret-key" \
  --name elysia-app elysia-app

# 挂载数据卷 (持久化)
docker run -d -p 3000:3000 \
  -v myapp-data:/app/data \
  -v myapp-logs:/app/logs \
  --name elysia-app elysia-app
```

### 管理容器

```bash
# 查看运行状态
docker ps
docker ps -a | grep elysia-app

# 查看日志
docker logs elysia-app
docker logs -f elysia-app        # 实时查看
docker logs --tail 100 elysia-app # 查看最后 100 行

# 进入容器
docker exec -it elysia-app /bin/bash

# 重启容器
docker restart elysia-app

# 停止容器
docker stop elysia-app

# 删除容器
docker rm elysia-app
```

### 生产环境最佳实践

```bash
# 1. 使用非 root 用户运行
# 在 Dockerfile 中添加:
RUN adduser --system --uid 1001 bunuser
USER bunuser

# 2. 设置资源限制
docker run -d -p 3000:3000 \
  --memory="512m" \
  --cpus="1.0" \
  --name elysia-app elysia-app

# 3. 配置健康检查
docker run -d -p 3000:3000 \
  --health-cmd="curl -f http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  --name elysia-app elysia-app

# 4. 配置日志轮转
# 在 /etc/docker/daemon.json 中配置:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## Docker Compose 部署

### 前置准备

1. 安装 Docker Compose: https://docs.docker.com/compose/install/
2. 确保项目包含 `docker-compose.yml`

### 配置文件说明

```yaml
# src/deployment/docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/prod.db
    volumes:
      - app-data:/app/data
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

volumes:
  app-data:
  redis-data:
```

### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 启动指定服务
docker-compose up -d app redis

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f app

# 重新构建并启动
docker-compose up -d --build

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重启服务
docker-compose restart

# 进入应用容器
docker-compose exec app /bin/bash

# 查看资源使用
docker-compose top
```

### 多环境配置

```bash
# docker-compose.yml (基础配置)
# docker-compose.prod.yml (生产环境覆盖)
# docker-compose.dev.yml (开发环境覆盖)

# 使用多配置文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## PM2 部署

### 安装 PM2

```bash
# 全局安装
npm install -g pm2

# 或使用 yarn
yarn global add pm2
```

### 启动应用

```bash
# 使用配置文件启动
pm2 start src/deployment/pm2.config.js

# 直接启动
pm2 start src/advanced/bookmark-system.ts --interpreter bun --name elysia-app

# 集群模式 (多实例)
pm2 start src/advanced/bookmark-system.ts -i max --interpreter bun --name elysia-app

# 指定环境
pm2 start src/deployment/pm2.config.js --env production
```

### 管理应用

```bash
# 查看所有应用
pm2 status

# 查看详细信息
pm2 show elysia-app

# 查看日志
pm2 logs
pm2 logs elysia-app --lines 100

# 重启应用
pm2 restart elysia-app

# 停止应用
pm2 stop elysia-app

# 删除应用
pm2 delete elysia-app

# 监控资源使用
pm2 monit

# 查看性能指标
pm2 list
```

### 开机自启

```bash
# 配置开机自启
pm2 startup

# 保存当前进程列表
pm2 save

# 重新加载进程列表
pm2 resurrect
```

### 集群管理

```bash
# 扩缩容
pm2 scale elysia-app 4

# 热重载 (无停机)
pm2 reload elysia-app

# 优雅重启
pm2 restart elysia-app --update-env
```

---

## 云平台部署

### Vercel 部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 生产部署
vercel --prod

# 5. 查看部署
vercel ls
```

**vercel.json 配置**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/advanced/bookmark-system.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/advanced/bookmark-system.ts"
    }
  ]
}
```

### Railway 部署

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up
```

### Render 部署

1. 在 GitHub 上创建仓库
2. 在 Render 创建新服务
3. 连接 GitHub 仓库
4. 配置构建命令和启动命令
5. 部署

---

## 健康检查

### 配置健康检查端点

```typescript
// src/deployment/03-health-check.ts
import { Elysia } from 'elysia'

const app = new Elysia()
  // 基础健康检查
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }))
  
  // 详细健康检查
  .get('/health/ready', async () => {
    // 检查数据库、Redis 等
    return { status: 'ready' }
  })
  
  .listen(3000)

export default app
```

### Docker 健康检查配置

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: elysia-app
spec:
  containers:
  - name: app
    image: elysia-app:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

---

## 环境变量管理

### .env 文件示例

```bash
# .env
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=file:/app/data/prod.db

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Redis 配置
REDIS_URL=redis://localhost:6379

# 日志配置
LOG_LEVEL=info

# 第三方服务
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 加载环境变量

```typescript
// src/index.ts
import { Elysia } from 'elysia'

// 使用 process.env
const app = new Elysia()
  .get('/', () => ({
    env: process.env.NODE_ENV,
    port: process.env.PORT
  }))
  .listen(process.env.PORT || 3000)

export default app
```

### 使用 dotenv

```bash
# 安装
bun install @effect/dotenv

# TypeScript 中使用
import { parse } from '@effect/dotenv'
const env = await parse()
```

---

## 日志管理

### 日志级别

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onRequest(({ request }) => {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
  })
  .listen(3000)
```

### 结构化日志

```typescript
const log = {
  level: 'info',
  timestamp: new Date().toISOString(),
  method: request.method,
  url: request.url,
  status: response.status,
  duration: Date.now() - startTime
}

console.log(JSON.stringify(log))
```

### 日志收集

```bash
# Docker 日志
docker logs --tail 100 -f elysia-app

# 保存日志到文件
docker logs elysia-app > app.log 2>&1

# PM2 日志
pm2 logs --lines 1000

# 查看指定时间日志
journalctl -u elysia-app --since "2024-01-01" --until "2024-01-02"
```

---

## 性能优化

### 1. 使用集群模式

```bash
# PM2 集群
pm2 start app.ts -i max --interpreter bun
```

### 2. 启用 Gzip 压缩

```nginx
# nginx.conf
 gzip on;
 gzip_types text/plain application/json application/javascript text/css;
```

### 3. 配置缓存

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onBeforeHandle(({ set, request }) => {
    set.headers['Cache-Control'] = 'public, max-age=3600'
  })
```

### 4. 数据库优化

```typescript
// 使用连接池
// 添加数据库索引
// 使用 Prisma 查询优化
```

---

## 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 查看容器日志
docker logs elysia-app

# 进入容器调试
docker run -it --entrypoint /bin/bash elysia-app
```

#### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 使用不同端口
docker run -p 8080:3000 elysia-app
```

#### 3. 内存溢出

```bash
# 增加内存限制
docker run --memory="1g" elysia-app

# 查看内存使用
docker stats elysia-app
```

#### 4. 数据库连接失败

```bash
# 检查数据库服务
docker-compose ps

# 查看数据库日志
docker-compose logs postgres

# 测试连接
docker-compose exec app curl http://localhost:5432
```

### 调试技巧

```bash
# 1. 使用详细日志
NODE_ENV=development DEBUG=* bun run src/index.ts

# 2. 进入容器调试
docker exec -it elysia-app /bin/bash

# 3. 查看环境变量
docker exec elysia-app env

# 4. 测试健康检查
curl http://localhost:3000/health
```

---

## 部署检查清单

### 部署前检查

- [ ] 代码已测试通过
- [ ] 所有环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 静态资源已构建
- [ ] SSL 证书已配置
- [ ] 健康检查端点已配置
- [ ] 日志收集已配置
- [ ] 监控告警已配置

### 部署后检查

- [ ] 应用正常响应
- [ ] 健康检查通过
- [ ] 日志正常输出
- [ ] 性能指标正常
- [ ] 备份策略已配置
- [ ] 回滚方案已测试

---

## 快速参考

### Docker 快速部署

```bash
# 构建并运行
docker build -t elysia-app . && docker run -d -p 3000:3000 --name elysia-app elysia-app

# 查看状态
docker ps && docker logs -f elysia-app
```

### Docker Compose 快速部署

```bash
# 一键部署
docker-compose up -d --build
```

### PM2 快速部署

```bash
# 安装并启动
npm install -g pm2 && pm2 start src/deployment/pm2.config.js
```

---

祝你部署顺利！🚀
