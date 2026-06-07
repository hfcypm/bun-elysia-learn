# CORS 跨域配置完全指南

> 前后端分离必备知识 - 从零开始理解 CORS  
> **适用**: 任何前后端分离项目 | **框架**: Elysia.js

---

## 📋 目录

1. [什么是 CORS](#什么是-cors)
2. [为什么需要 CORS](#为什么需要-cors)
3. [工作原理](#工作原理)
4. [Elysia 配置](#elysia-配置)
5. [前端调用](#前端调用)
6. [常见问题](#常见问题)

---

## 什么是 CORS

### 全称

**CORS** = **Cross-Origin Resource Sharing** (跨域资源共享)

### 通俗理解

```
前端页面 (http://localhost:5173)
    ↓ 想访问
后端 API (http://localhost:3000)
    ↓
浏览器：不同源！需要通行证 (CORS) 🛡️
```

### 同源策略

浏览器禁止**不同源**的网页访问彼此资源：

| 比较项 | URL A | URL B | 是否同源 |
|--------|-------|-------|----------|
| 协议 | `http://` | `https://` | ❌ 不同 |
| 域名 | `example.com` | `api.example.com` | ❌ 不同 |
| 端口 | `:3000` | `:8080` | ❌ 不同 |

---

## 为什么需要 CORS

### 场景

```
你开发了一个项目:
├── 前端：React + Vite (localhost:5173)
└── 后端：Elysia (localhost:3000)

前端调用后端 API:
fetch('http://localhost:3000/api/users')
```

### 没有 CORS

```
浏览器控制台报错:
❌ Access to fetch at 'http://localhost:3000/api/users' 
   from origin 'http://localhost:5173' has been blocked 
   by CORS policy: No 'Access-Control-Allow-Origin' header 
   is present on the requested resource.
```

### 有 CORS

```
后端设置响应头:
Access-Control-Allow-Origin: http://localhost:5173

浏览器：✅ 放行！
```

---

## 工作原理

### CORS 请求流程

```
┌───────────┐                              ┌───────────┐
│  浏览器   │                              │  服务器   │
│ (前端)    │                              │ (后端)    │
└─────┬─────┘                              └─────┬─────┘
      │                                         │
      │ 1. 简单请求：直接发送 GET/POST         │
      │──────────────────────────────────────>│
      │                                         │
      │ 2. 复杂请求：先发送 OPTIONS (预检)     │
      │──────────────────────────────────────>│
      │                                         │
      │ 3. 返回 CORS 响应头                     │
      │<───────────────────────────────────────│
      │                                         │
      │ 4. 预检通过，发送真实请求               │
      │──────────────────────────────────────>│
      │                                         │
      │ 5. 返回实际数据                         │
      │<───────────────────────────────────────│
      │                                         │
```

### 简单请求 vs 复杂请求

| 类型 | 条件 | 是否需要预检 |
|------|------|--------------|
| **简单请求** | GET/POST/HEAD + 简单 headers | ❌ 不需要 |
| **复杂请求** | PUT/DELETE + 自定义 headers | ✅ 需要 OPTIONS |

---

## Elysia 配置

### 安装

```bash
bun add @elysiajs/cors
```

### 基础配置

```typescript
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }))
  .listen(3000)
```

### 生产环境配置

```typescript
const isDev = process.env.NODE_ENV === 'development'

const corsConfig = {
  origin: (origin: string) => {
    // 开发环境允许所有 localhost
    if (isDev && origin?.includes('localhost')) return true
    
    // 生产环境严格验证
    const allowedOrigins = [
      'https://your-domain.com',
      'https://www.your-domain.com',
    ]
    return allowedOrigins.includes(origin) ? origin : false
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page'],
  credentials: true,
  maxAge: 86400,
}
```

### 配置参数说明

| 参数 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `origin` | string\|function | 允许的源 | `'http://localhost:5173'` |
| `methods` | string[] | 允许的方法 | `['GET', 'POST']` |
| `allowedHeaders` | string[] | 允许的请求头 | `['Content-Type']` |
| `exposedHeaders` | string[] | 允许的响应头 | `['X-Total-Count']` |
| `credentials` | boolean | 允许携带 Cookie | `true` |
| `maxAge` | number | 预检缓存时间 (秒) | `86400` |

---

## 前端调用

### Fetch API

```typescript
// 基础调用
const response = await fetch('http://localhost:3000/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // 携带 Cookie
})

const data = await response.json()
```

### Axios

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // 携带 Cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// 使用
const response = await api.get('/api/users')
```

### React 示例

```typescript
import { useEffect, useState } from 'react'

function UsersList() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    fetch('http://localhost:3000/api/users', {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(err => console.error('CORS Error:', err))
  }, [])
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Vue 示例

```typescript
<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])

onMounted(async () => {
  const response = await fetch('http://localhost:3000/api/users', {
    credentials: 'include',
  })
  const data = await response.json()
  users.value = data
})
</script>
```

---

## 常见问题

### Q1: No 'Access-Control-Allow-Origin'

**错误**:
```
No 'Access-Control-Allow-Origin' header is present
```

**原因**: 后端未配置 CORS 或 origin 不匹配

**解决**:
```typescript
// 后端添加 CORS 中间件
app.use(cors({
  origin: ['http://localhost:5173'] // 添加前端地址
}))
```

---

### Q2: Credentials Flag is True

**错误**:
```
Credentials flag is 'true', but Access-Control-Allow-Credentials is 'false'
```

**原因**: credentials 配置不一致

**解决**:
```typescript
// 后端
app.use(cors({ credentials: true }))

// 前端
fetch('...', { credentials: 'include' })
```

---

### Q3: Method Not Allowed

**错误**:
```
Method PUT is not allowed by Access-Control-Allow-Methods
```

**原因**: 未允许该方法

**解决**:
```typescript
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
```

---

### Q4: Header Not Allowed

**错误**:
```
Header 'X-Custom-Header' is not allowed by Access-Control-Allow-Headers
```

**原因**: 自定义头不在白名单

**解决**:
```typescript
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header']
}))
```

---

### Q5: Cookie 发送不过去

**问题**: 登录后 Cookie 未携带

**检查清单**:
- [ ] 后端 `credentials: true`
- [ ] 前端 `credentials: 'include'`
- [ ] Cookie 设置 `sameSite: 'lax'`
- [ ] Cookie 设置 `path: '/'`

**解决**:
```typescript
// 后端
cookie.set('session_token', 'xxx', {
  httpOnly: true,
  secure: false,  // 开发环境允许 false
  sameSite: 'lax',
  path: '/',
})

// 前端
fetch('...', { credentials: 'include' })
```

---

### Q6: 生产环境 404

**问题**: 开发环境正常，生产环境 404

**原因**: 基础路径 (base) 配置问题

**解决 Vite**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // GitHub Pages 需要改
})
```

**解决 Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🚀 快速测试

### 启动后端

```bash
bun run examples/03-middleware/cors.ts
```

### 打开测试页面

```bash
# 在浏览器打开
examples/03-middleware/cors-test-frontend.html
```

### 或使用 curl

```bash
# 测试 GET
curl -i http://localhost:3302/api/data

# 测试 OPTIONS (预检)
curl -X OPTIONS http://localhost:3302/api/data -i

# 测试 POST
curl -X POST http://localhost:3302/api/submit \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 📖 参考资源

- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Elysia CORS 插件](https://github.com/elysiajs/elysia-cors)
- [CORS 在线测试工具](https://cors-test.codefetch.com/)

---

**Happy Coding! 🎉**
