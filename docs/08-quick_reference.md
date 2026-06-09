# Elysia.js 快速参考卡片

## 🚀 创建应用

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello World')
  .listen(3000)
```

## 📍 路由定义

```typescript
// 基础路由
.get('/path', handler)
.post('/path', handler)
.put('/path', handler)
.patch('/path', handler)
.delete('/path', handler)
.head('/path', handler)
.options('/path', handler)

// 路径参数
.get('/users/:id', ({ params }) => params.id)
.get('/users/:userId/posts/:postId', ({ params }) => params)

// 查询参数
.get('/search', ({ query }) => query.q)

// 请求体
.post('/users', ({ body }) => body.name)

// 请求头
.get('/headers', ({ request }) => {
  return request.headers.get('Authorization')
})

// Cookie
.get('/cookie', ({ cookie }) => {
  return cookie.session.value
})
```

## ✅ 验证 (TypeBox)

```typescript
// 请求体验证
.post('/users', ({ body }) => body, {
  body: t.Object({
    username: t.String({ minLength: 3, maxLength: 20 }),
    email: t.String({ format: 'email' }),
    password: t.String({ minLength: 6 }),
    age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
    role: t.Union([t.Literal('user'), t.Literal('admin')]),
    tags: t.Optional(t.Array(t.String())),
    metadata: t.Optional(t.Record(t.String(), t.Any()))
  })
})

// 查询参数验证
.get('/products', ({ query }) => query, {
  query: t.Object({
    page: t.Optional(t.Number({ default: 1, minimum: 1 })),
    limit: t.Optional(t.Number({ default: 20, maximum: 100 })),
    sort: t.Optional(t.Union([
      t.Literal('price'),
      t.Literal('sales'),
      t.Literal('rating')
    ]))
  })
})

// 路径参数验证
.get('/articles/:id', ({ params }) => params, {
  params: t.Object({
    id: t.Number({ minimum: 1 })
  })
})
```

## 🔧 状态码设置

```typescript
// 方式 1: 使用 set.status
.get('/not-found', ({ set }) => {
  set.status = 404
  return { error: 'Not Found' }
})

// 方式 2: 使用 status 方法
.status(418, { message: "I'm a teapot" })

// 常用状态码
200  // OK - 成功
201  // Created - 创建成功
204  // No Content - 删除成功
400  // Bad Request - 请求参数错误
401  // Unauthorized - 未授权
403  // Forbidden - 禁止访问
404  // Not Found - 资源不存在
409  // Conflict - 资源冲突
422  // Unprocessable Entity - 验证失败
429  // Too Many Requests - 请求过多
500  // Internal Server Error - 服务器错误
```

## 🧩 中间件

```typescript
// 全局中间件
app.onRequest(({ request }) => {
  console.log(`${request.method} ${request.url}`)
})

app.onAfterHandle(({ response }) => {
  console.log('Response:', response)
})

// 局部中间件 (derive)
app.derive(({ request, set }) => {
  const token = request.headers.get('Authorization')
  if (!token) {
    set.status = 401
    return { user: null }
  }
  return { user: decodeToken(token) }
})

// 路由组中间件
app.group('/api', app => app
  .use(authMiddleware)
  .get('/protected', handler)
)
```

## 📦 常用插件

```typescript
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { staticPlugin } from '@elysiajs/static'

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// JWT
app.use(jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET!
}))

// Swagger 文档
app.use(swagger({
  documentation: {
    info: {
      title: 'My API',
      version: '1.0.0'
    }
  }
}))

// 静态文件
app.use(staticPlugin({
  assets: 'public',
  prefix: '/static'
}))
```

## 🎯 错误处理

```typescript
// 全局错误处理
app.onError(({ code, error }) => {
  console.error('Error:', error)

  if (code === 'VALIDATION') {
    return {
      success: false,
      message: '验证失败',
      errors: error.errors
    }
  }

  if (code === 'NOT_FOUND') {
    return {
      success: false,
      message: '资源不存在'
    }
  }

  return {
    success: false,
    message: '服务器错误'
  }
})

// 404 处理
app.onNotFound(({ request }) => {
  return {
    success: false,
    message: '接口不存在',
    path: new URL(request.url).pathname
  }
})
```

## 🔄 响应类型

```typescript
// JSON 响应
.get('/json', () => ({ message: 'Hello' }))

// HTML 响应
.get('/html', () => new Response('<h1>Hello</h1>'))

// 文本响应
.get('/text', () => 'Plain text')

// 文件响应
.get('/file', () => Bun.file('example.txt'))

// 流响应
.get('/stream', () => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue('data')
      controller.close()
    }
  })
})

// 重定向
.get('/redirect', ({ redirect }) => {
  return redirect('https://example.com')
})

// 自定义响应头
.get('/headers', ({ set }) => {
  set.headers['X-Custom-Header'] = 'value'
  return { message: 'Hello' }
})

// 自动 Content-Type
.get('/auto', ({ set }) => {
  set.headers['Content-Type'] = 'application/json'
  return JSON.stringify({ message: 'Hello' })
})
```

## 📁 文件上传

```typescript
// 单文件上传
.post('/upload', async ({ body }) => {
  const file = body.avatar
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // 保存文件...
  
  return {
    success: true,
    message: '上传成功'
  }
}, {
  body: t.Object({
    avatar: t.File()
  })
})

// 多文件上传
.post('/upload/multiple', async ({ body }) => {
  const files = Array.isArray(body.files) ? body.files : [body.files]
  
  return {
    success: true,
    count: files.length
  }
}, {
  body: t.Object({
    files: t.Array(t.File())
  })
})
```

## 🔐 JWT 认证

```typescript
import { jwt } from '@elysiajs/jwt'

app
  .use(jwt({ name: 'jwt', secret: 'your-secret' }))
  
  // 登录 - 生成 Token
  .post('/login', async ({ body, jwt, set }) => {
    const user = await validateUser(body)
    
    if (!user) {
      set.status = 401
      return { error: 'Invalid credentials' }
    }

    const token = await jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role
    })

    return { token }
  })

  // 受保护路由 - 验证 Token
  .get('/protected', async ({ request, set, jwt }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { error: 'No token' }
    }

    const payload = await jwt.verify(
      authHeader.replace('Bearer ', '')
    )

    if (!payload) {
      set.status = 401
      return { error: 'Invalid token' }
    }

    return { user: payload }
  })
```

## 🛡️ 安全最佳实践

```typescript
// Helmet - 安全头
import { helmet } from '@elysiajs/helmet'
app.use(helmet())

// 速率限制
const rateLimitMap = new Map()
app.derive(({ request, set }) => {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const limit = 100
  const window = 60000

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + window }
  
  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + window
  } else {
    record.count++
  }

  if (record.count > limit) {
    set.status = 429
    set.headers['Retry-After'] = Math.ceil((record.resetTime - now) / 1000).toString()
    throw new Error('Too many requests')
  }

  rateLimitMap.set(ip, record)
})

// CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  maxAge: 600
}))
```

## 📊 性能优化

```typescript
// 响应缓存
const cache = new Map()
app.onBeforeHandle(({ request, set }) => {
  const cached = cache.get(request.url)
  if (cached && Date.now() < cached.expires) {
    set.headers['X-Cache'] = 'HIT'
    return cached.response
  }
  set.headers['X-Cache'] = 'MISS'
})

// Gzip 压缩
import { gzip } from 'node:zlib'
app.onAfterHandle(async ({ response, set }) => {
  if (typeof response === 'string') {
    const compressed = await gzip(response)
    set.headers['Content-Encoding'] = 'gzip'
    return new Response(compressed)
  }
})

// 数据库连接池
import { Pool } from 'pg'
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

## 🧪 测试示例

```typescript
// Bun 测试
import { describe, it, expect } from 'bun:test'

describe('API Tests', () => {
  it('should return hello', async () => {
    const response = await fetch('http://localhost:3000/')
    const data = await response.json()
    expect(data.message).toBe('Hello World')
  })

  it('should create user', async () => {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    })
    expect(response.status).toBe(201)
  })
})
```

## 📝 环境变量

```typescript
// config.ts
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydb'
  },
  nodeEnv: process.env.NODE_ENV || 'development'
}

// 使用
import { config } from './config'
app.listen(config.port)
```
