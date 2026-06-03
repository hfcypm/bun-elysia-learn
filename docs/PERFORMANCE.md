# Elysia.js 性能优化指南

> 提升应用性能的最佳实践

---

## ⚡ 目录

1. [性能基准测试](#性能基准测试)
2. [响应缓存](#响应缓存)
3. [数据库优化](#数据库优化)
4. [请求压缩](#请求压缩)
5. [并发处理](#并发处理)
6. [内存管理](#内存管理)
7. [性能监控](#性能监控)
8. [CDN 集成](#cdn 集成)

---

## 性能基准测试

### 使用 autocannon

```bash
# 安装
npm install -g autocannon

# 测试 API
autocannon http://localhost:3000/api/users

# 并发测试
autocannon -c 100 -d 30 http://localhost:3000/api/users

# POST 请求测试
autocannon -c 100 -m POST -H "Content-Type: application/json" -b '{"name":"test"}' http://localhost:3000/api/users
```

### 解读结果

```
┌─────────┬──────┬──────┬───────┬──────┬──────┬─────────┬──────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg  │ Stdev  │ Max      │
├─────────┼──────┼──────┼───────┼──────┼──────┼─────────┼──────────┤
│ Latency │ 1 ms │ 3 ms │ 10 ms │ 15 ms│ 4 ms │ 5 ms    │ 150 ms   │
└─────────┴──────┴──────┴───────┴──────┴──────┴─────────┴──────────┘
Requests/sec: 2500
```

---

## 响应缓存

### 内存缓存

```typescript
import { Elysia } from 'elysia'

class Cache {
  private store = new Map<string, { data: any; expiry: number }>()
  
  get(key: string) {
    const item = this.store.get(key)
    if (!item || Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }
    return item.data
  }
  
  set(key: string, data: any, ttl: number = 3600000) {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }
  
  delete(key: string) {
    this.store.delete(key)
  }
}

const cache = new Cache()

const app = new Elysia()
  .get('/api/users', async ({ request }) => {
    const cacheKey = `users:${request.url}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // 从数据库获取
    const users = await db.user.findMany()
    cache.set(cacheKey, users, 5 * 60 * 1000) // 5 分钟缓存
    
    return users
  })
```

### Redis 缓存

```typescript
import { Elysia } from 'elysia'
import Redis from 'ioredis'

const redis = new Redis()

app.get('/api/products/:id', async ({ params }) => {
  const cacheKey = `product:${params.id}`
  
  // 尝试从 Redis 获取
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // 从数据库获取
  const product = await db.product.findUnique({
    where: { id: Number(params.id) }
  })
  
  // 写入缓存 (10 分钟)
  await redis.setex(cacheKey, 600, JSON.stringify(product))
  
  return product
})
```

### HTTP 缓存头

```typescript
app.onBeforeHandle(({ set }) => {
  set.headers['Cache-Control'] = 'public, max-age=3600'
  set.headers['ETag'] = '"abc123"'
  set.headers['Last-Modified'] = new Date().toUTCString()
})
```

---

## 数据库优化

### 1. 添加索引

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique // 唯一索引
  name  String
  role  String  @db.VarChar(20)
  
  @@index([role]) // 添加索引
  @@index([email, role]) // 复合索引
}
```

### 2. 选择性查询

```typescript
// ❌ 查询所有字段
const users = await prisma.user.findMany()

// ✅ 只查询需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
})
```

### 3. 使用连接池

```typescript
// Prisma 自动管理连接池
// 可通过环境变量配置：
// DATABASE_URL="postgres://user:pass@host:5432/db?connection_limit=10"

// 手动配置连接池
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
})
```

### 4. 批量操作

```typescript
// ❌ N+1 查询
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id }
  })
}

// ✅ 批量查询
const posts = await prisma.post.findMany({
  where: {
    userId: { in: users.map(u => u.id) }
  }
})
```

---

## 请求压缩

### Gzip 压缩

```typescript
import { Elysia } from 'elysia'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)

app.onAfterHandle(async ({ response, request }) => {
  const acceptEncoding = request.headers.get('Accept-Encoding') || ''
  
  if (acceptEncoding.includes('gzip') && typeof response === 'string') {
    const compressed = await gzipAsync(response)
    return new Response(compressed, {
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    })
  }
  
  return response
})
```

### Nginx 配置

```nginx
server {
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1000;
  gzip_comp_level 6;
}
```

---

## 并发处理

### Promise.all

```typescript
// ❌ 串行查询 (慢)
const user = await prisma.user.findUnique({ where: { id: 1 } })
const posts = await prisma.post.findMany({ where: { userId: 1 } })
const comments = await prisma.comment.findMany({ where: { userId: 1 } })

// ✅ 并发查询 (快)
const [user, posts, comments] = await Promise.all([
  prisma.user.findUnique({ where: { id: 1 } }),
  prisma.post.findMany({ where: { userId: 1 } }),
  prisma.comment.findMany({ where: { userId: 1 } })
])
```

### 批量处理

```typescript
// 分批处理大数据
async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await processor(batch)
  }
}

// 使用
await processInBatches(users, 100, async (batch) => {
  await Promise.all(batch.map(sendEmail))
})
```

---

## 内存管理

### 避免内存泄漏

```typescript
// ❌ 内存泄漏：无限增长的 Map
const cache = new Map()
app.get('/api/data/:id', ({ params }) => {
  const key = `data:${params.id}`
  if (!cache.has(key)) {
    cache.set(key, fetchData(params.id)) // 永不清理
  }
  return cache.get(key)
})

// ✅ 使用 LRU 缓存
import { LRUCache } from 'lru-cache'

const cache = new LRUCache({
  max: 1000, // 最多 1000 项
  ttl: 1000 * 60 * 5 // 5 分钟过期
})
```

### 流式传输大数据

```typescript
import { Readable } from 'node:stream'

app.get('/api/large-data', () => {
  const stream = new Readable({
    read() {
      // 流式发送数据
      this.push(JSON.stringify({ data: '...' }))
      this.push(null) // 结束
    }
  })
  
  return stream
})
```

---

## 性能监控

### 记录响应时间

```typescript
app.onAfterHandle(({ request, response, set }) => {
  const duration = Date.now() - startTime
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.url,
    status: set.status,
    duration: `${duration}ms`
  }))
})
```

### 使用 APM 工具

```typescript
// Sentry 性能监控
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
})

app.onAfterHandle(({ error }) => {
  if (error) {
    Sentry.captureException(error)
  }
})
```

### Prometheus 指标

```typescript
import { register, Counter, Histogram } from 'prom-client'

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests'
})

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration'
})

app.onAfterHandle(({ request, set }) => {
  httpRequestCounter.inc()
  requestDuration.observe(duration / 1000)
})

app.get('/metrics', async () => {
  return await register.metrics()
})
```

---

## CDN 集成

### Cloudflare CDN

```typescript
// 设置缓存头
app.onBeforeHandle(({ set }) => {
  set.headers['CDN-Cache-Control'] = 'public, max-age=3600'
  set.headers['Cache-Control'] = 'public, max-age=3600'
})
```

### 静态资源 CDN

```typescript
// 配置静态文件 CDN URL
const CDN_URL = 'https://cdn.example.com'

app.get('/api/config', () => ({
  cdnUrl: CDN_URL,
  apiVersion: '1.0.0'
}))
```

---

## 性能优化检查清单

### 代码层面
- [ ] 使用选择性查询
- [ ] 批量数据库操作
- [ ] 并发处理独立任务
- [ ] 实现缓存策略
- [ ] 避免 N+1 查询

### 服务器层面
- [ ] 启用 Gzip 压缩
- [ ] 配置 HTTP 缓存
- [ ] 使用连接池
- [ ] 集群模式运行
- [ ] 优化资源限制

### 架构层面
- [ ] CDN 分发静态资源
- [ ] 数据库读写分离
- [ ] Redis 缓存热点数据
- [ ] 异步处理耗时任务
- [ ] 负载均衡

---

## 性能基准

### 目标性能指标

| 指标 | 目标值 | 警告值 |
|------|--------|--------|
| 响应时间 (P50) | < 50ms | > 100ms |
| 响应时间 (P95) | < 200ms | > 500ms |
| 响应时间 (P99) | < 500ms | > 1000ms |
| 吞吐量 | > 1000 req/s | < 500 req/s |
| 错误率 | < 0.1% | > 1% |
| 内存使用 | < 512MB | > 1GB |

---

## 快速参考

### 性能优化命令

```bash
# 性能测试
autocannon -c 100 http://localhost:3000

# 内存分析
node --inspect app.js

# 生成火焰图
0x app.js
```

### 常用缓存 TTL

```typescript
// 用户数据：5 分钟
CACHE_USER = 5 * 60 * 1000

// 配置数据：1 小时
CACHE_CONFIG = 60 * 60 * 1000

// 页面缓存：1 天
CACHE_PAGE = 24 * 60 * 60 * 1000
```

---

祝你构建高性能应用！⚡
