# Elysia.js 学习项目 FAQ

> 常见问题解答

---

## 📋 目录

1. [安装问题](#安装问题)
2. [运行问题](#运行问题)
3. [代码问题](#代码问题)
4. [部署问题](#部署问题)
5. [性能问题](#性能问题)
6. [最佳实践](#最佳实践)

---

## 安装问题

### Q: Bun 安装失败

**A:** 使用官方安装脚本：

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# 使用 npm
npm install -g bun
```

### Q: 依赖安装失败

**A:** 检查网络连接，使用国内镜像：

```bash
# 使用 taobao 镜像
bun config set registry https://registry.npmmirror.com
bun install
```

### Q: TypeScript 编译错误

**A:** 检查 tsconfig.json 配置：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## 运行问题

### Q: 端口被占用

**A:** 查找并关闭占用端口的进程：

```bash
# 查看端口占用
lsof -i :3000

# 或使用
netstat -tunlp | grep 3000

# 关闭进程
kill -9 <PID>

# 或使用不同端口
PORT=3001 bun run src/index.ts
```

### Q: 环境变量不生效

**A:** 确保正确加载 .env 文件：

```typescript
// 方式 1: 自动加载 (Bun)
// .env 文件在根目录自动加载

// 方式 2: 手动加载
import { parse } from '@effect/dotenv'
const env = await parse()

// 方式 3: 使用 process.env
const port = process.env.PORT || 3000
```

### Q: WebSocket 连接失败

**A:** 检查 CORS 配置和协议：

```typescript
import { cors } from '@elysiajs/cors'

app.use(cors({
  origin: '*', // 开发环境允许所有来源
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 使用正确的协议
const ws = new WebSocket('ws://localhost:3000/ws') // 不是 http://
```

---

## 代码问题

### Q: TypeBox 验证不生效

**A:** 确保验证配置正确：

```typescript
// ❌ 错误：配置位置不对
app.post('/users', ({ body }) => body, {
  body: t.Object({ name: t.String() }) // 配置在外
})

// ✅ 正确：配置在第二个参数
app.post('/users', ({ body }) => body, {
  body: t.Object({ name: t.String() })
})
```

### Q: JWT Token 验证失败

**A:** 检查 Secret 和有效期：

```typescript
// 确保 Secret 一致
const secret = process.env.JWT_SECRET!

// Token 生成
const token = await jwt.sign({ userId: 1 })

// Token 验证
const payload = await jwt.verify(token)
if (!payload) {
  // Token 无效或过期
}
```

### Q: 数据库连接失败

**A:** 检查数据库 URL 和驱动：

```typescript
// SQLite
DATABASE_URL="file:./dev.db"

// PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

// 测试连接
try {
  await db.$connect()
  console.log('数据库连接成功')
} catch (error) {
  console.error('数据库连接失败:', error)
}
```

---

## 部署问题

### Q: Docker 容器无法启动

**A:** 检查 Dockerfile 和端口：

```dockerfile
# ✅ 正确的 Dockerfile 示例
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

```bash
# 查看容器日志
docker logs <container-id>

# 进入容器调试
docker exec -it <container-id> /bin/bash
```

### Q: PM2 启动失败

**A:** 检查配置文件：

```javascript
// pm2.config.js
module.exports = {
  apps: [{
    name: 'elysia-app',
    script: './src/index.ts',
    interpreter: 'bun', // 使用 Bun
    instances: 'max',
    exec_mode: 'cluster'
  }]
}
```

```bash
# 启动应用
pm2 start pm2.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

### Q: 健康检查失败

**A:** 确保健康检查端点存在：

```typescript
// 添加健康检查端点
app.get('/health', () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}))
```

---

## 性能问题

### Q: API 响应慢

**A:** 排查以下步骤：

1. **检查数据库查询**
   ```typescript
   // 添加索引
   // 使用选择性查询
   // 优化 N+1 查询
   ```

2. **启用缓存**
   ```typescript
   // 使用 Redis 或内存缓存
   ```

3. **并发处理**
   ```typescript
   // 使用 Promise.all 并发查询
   ```

4. **性能分析**
   ```bash
   autocannon -c 100 http://localhost:3000
   ```

### Q: 内存使用过高

**A:** 检查内存泄漏：

```typescript
// 1. 使用 LRU 缓存
import { LRUCache } from 'lru-cache'
const cache = new LRUCache({ max: 1000, ttl: 300000 })

// 2. 及时清理资源
app.onStop(() => {
  // 关闭数据库连接
  // 清理定时器
})

// 3. 监控内存使用
setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory:', usage.heapUsed / 1024 / 1024, 'MB')
}, 60000)
```

---

## 最佳实践

### Q: 项目结构如何组织？

**A:** 推荐结构：

```
project/
├── src/
│   ├── basic/          # 基础案例
│   ├── intermediate/   # 中级案例
│   ├── advanced/       # 高级案例
│   ├── testing/        # 测试文件
│   └── index.ts        # 入口文件
├── docs/               # 文档
├── examples/           # 示例代码
├── tests/              # 测试
├── prisma/             # 数据库 Schema
└── package.json
```

### Q: 如何组织大型项目？

**A:** 按功能模块拆分：

```
src/
├── controllers/    # 控制器
├── services/       # 业务逻辑
├── models/         # 数据模型
├── middleware/     # 中间件
├── utils/          # 工具函数
├── config/         # 配置
└── index.ts        # 入口
```

### Q: 如何管理 API 版本？

**A:** 使用路由前缀：

```typescript
const v1 = new Elysia({ prefix: '/api/v1' })
const v2 = new Elysia({ prefix: '/api/v2' })

v1.get('/users', getUsersV1)
v2.get('/users', getUsersV2)

app.use(v1).use(v2)
```

### Q: 如何处理错误？

**A:** 使用全局错误处理：

```typescript
app.onError(({ code, error, set }) => {
  console.error('Error:', error)
  
  if (code === 'VALIDATION') {
    set.status = 422
    return { error: '验证失败', details: error.errors }
  }
  
  if (code === 'NOT_FOUND') {
    set.status = 404
    return { error: '资源不存在' }
  }
  
  set.status = 500
  return { error: '服务器错误' }
})
```

---

## 快速搜索

### 按关键词

- **安装**: Q: Bun 安装失败
- **端口**: Q: 端口被占用
- **验证**: Q: TypeBox 验证不生效
- **JWT**: Q: JWT Token 验证失败
- **数据库**: Q: 数据库连接失败
- **Docker**: Q: Docker 容器无法启动
- **性能**: Q: API 响应慢
- **内存**: Q: 内存使用过高

---

## 获取帮助

### 官方资源

- **[Elysia 官方文档](https://elysiajs.com)**
- **[Bun 官方文档](https://bun.sh/docs)**
- **[GitHub Issues](https://github.com/elysiajs/elysia/issues)**
- **[Discord 社区](https://discord.gg/elysia)**

### 社区资源

- **[Stack Overflow](https://stackoverflow.com/questions/tagged/elysia)**
- **[Reddit r/Bun](https://www.reddit.com/r/Bun)**
- **[Twitter @ElysiaJS](https://twitter.com/elysiajs)**

---

如果问题未在本文档中找到解答，欢迎在 GitHub 提交 Issue！
