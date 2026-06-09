# Elysia.js 安全指南

> Web 应用安全最佳实践

---

## 🔒 目录

1. [安全威胁总览](#安全威胁总览)
2. [XSS 防护](#xss 防护)
3. [CSRF 防护](#csrf 防护)
4. [输入验证与清理](#输入验证与清理)
5. [认证与授权](#认证与授权)
6. [密码安全](#密码安全)
7. [速率限制](#速率限制)
8. [HTTPS 配置](#https-配置)
9. [安全审计](#安全审计)
10. [应急响应](#应急响应)

---

## 安全威胁总览

### OWASP Top 10 (2021)

| 排名 | 威胁 | Elysia 防护措施 |
|------|------|----------------|
| A01 | 失效的访问控制 | JWT 认证、角色权限 |
| A02 | 加密机制失效 | HTTPS、bcrypt 密码加密 |
| A03 | 注入 | TypeBox 验证、参数化查询 |
| A04 | 不安全设计 | 安全中间件、Helmet |
| A05 | 安全配置错误 | Helmet 响应头、CORS 配置 |
| A06 | 易受攻击的组件 | 定期更新依赖 |
| A07 | 认证失败 | JWT、速率限制、双因素 |
| A08 | 软件和数据完整性 | 输入验证、哈希校验 |
| A09 | 日志和监控失败 | 结构化日志、告警 |
| A10 | SSRF | URL 验证、白名单 |

---

## XSS 防护

### 什么是 XSS

跨站脚本攻击 (XSS) 通过在网页中注入恶意脚本代码来攻击用户。

### 防护措施

#### 1. 设置安全响应头

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .onRequest(({ set }) => {
    // 启用 XSS 过滤器
    set.headers['X-XSS-Protection'] = '1; mode=block'
    
    // 防止 MIME 类型嗅探
    set.headers['X-Content-Type-Options'] = 'nosniff'
    
    // 内容安全策略 (CSP)
    set.headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:"
    ].join('; ')
  })
```

#### 2. 输出编码

```typescript
// 转义 HTML 特殊字符
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 使用
app.get('/api/user/:name', ({ params }) => {
  const safeName = escapeHtml(params.name)
  return { name: safeName }
})
```

#### 3. 使用 TypeBox 验证

```typescript
import { t } from 'elysia'

app.post('/api/comment', ({ body }) => {
  return { comment: body.text }
}, {
  body: t.Object({
    text: t.String({
      minLength: 1,
      maxLength: 1000,
      // 自定义验证：禁止 script 标签
      pattern: '^((?!<script).)*$'
    })
  })
})
```

---

## CSRF 防护

### 什么是 CSRF

跨站请求伪造 (CSRF) 攻击者诱导用户执行非预期的操作。

### 防护措施

#### 1. 使用 CSRF Token

```typescript
import { Elysia } from 'elysia'
import crypto from 'crypto'

const csrfTokens = new Map<string, string>()

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

const app = new Elysia()
  // 获取 CSRF Token
  .get('/api/csrf-token', ({ cookie }) => {
    const token = generateToken()
    cookie.csrfToken.set({
      value: token,
      httpOnly: true,
      sameSite: 'Strict'
    })
    return { token }
  })
  
  // 验证 CSRF Token
  .derive(({ cookie, request, set }) => {
    const submittedToken = request.headers.get('X-CSRF-Token')
    const cookieToken = cookie.csrfToken.value
    
    if (!submittedToken || !cookieToken || submittedToken !== cookieToken) {
      set.status = 403
      throw new Error('Invalid CSRF token')
    }
    
    return { csrfVerified: true }
  })
  
  // 受保护的操作
  .post('/api/transfer', () => {
    // CSRF 已验证，执行转账操作
    return { success: true }
  })
```

#### 2. SameSite Cookie 属性

```typescript
app.post('/api/login', ({ body, cookie, set }) => {
  // 验证用户...
  
  // 设置带有 SameSite 属性的 Cookie
  cookie.sessionToken.set({
    value: 'your-session-token',
    httpOnly: true,
    secure: true, // 仅 HTTPS
    sameSite: 'Strict', // 或 'Lax'
    path: '/',
    maxAge: 3600 // 1 小时
  })
  
  return { success: true }
})
```

#### 3. 验证 Referer 头

```typescript
app.derive(({ request, set }) => {
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const referer = request.headers.get('Referer')
    const origin = request.headers.get('Origin')
    
    if (!referer || !referer.includes('yourdomain.com')) {
      set.status = 403
      throw new Error('Invalid origin')
    }
  }
})
```

---

## 输入验证与清理

### 输入验证

#### 使用 TypeBox

```typescript
import { t } from 'elysia'

app.post('/api/users', ({ body }) => {
  return { user: body }
}, {
  body: t.Object({
    username: t.String({
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$' // 只允许字母数字下划线
    }),
    email: t.String({
      format: 'email' // 内置邮箱格式验证
    }),
    age: t.Number({
      minimum: 0,
      maximum: 150
    }),
    role: t.Union([
      t.Literal('user'),
      t.Literal('admin')
    ])
  })
})
```

### 输入清理

```typescript
import sanitizeHtml from 'sanitize-html'

app.post('/api/article', ({ body }) => {
  // 清理 HTML 内容
  const cleanContent = sanitizeHtml(body.content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      'a': ['href']
    }
  })
  
  return { content: cleanContent }
}, {
  body: t.Object({
    content: t.String()
  })
})
```

### 防范 SQL 注入

```typescript
// ❌ 错误示例 - 字符串拼接
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ 正确示例 - 参数化查询
const query = 'SELECT * FROM users WHERE email = $1'
const params = [email]
const result = await db.query(query, params)

// 使用 Prisma (自动防止 SQL 注入)
const user = await prisma.user.findUnique({
  where: { email }
})
```

---

## 认证与授权

### JWT 认证

```typescript
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!
    })
  )
  
  // 登录
  .post('/api/auth/login', async ({ body, jwt, set }) => {
    // 验证用户...
    
    // 生成 JWT
    const token = await jwt.sign({
      userId: user.id,
      role: user.role
    })
    
    return { token }
  })
  
  // 受保护的 route
  .get('/api/profile', async ({ jwt, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { error: '未授权' }
    }
    
    const payload = await jwt.verify(authHeader.substring(7))
    
    if (!payload) {
      set.status = 401
      return { error: 'Token 无效' }
    }
    
    return { user: payload }
  })
```

### 基于角色的访问控制 (RBAC)

```typescript
// 权限中间件
function requireRole(...roles: string[]) {
  return async ({ request, set, jwt }: any) => {
    const authHeader = request.headers.get('Authorization')
    const payload = await jwt.verify(authHeader?.substring(7))
    
    if (!payload || !roles.includes(payload.role)) {
      set.status = 403
      return { error: '权限不足' }
    }
    
    return { user: payload }
  }
}

// 使用
app
  .get('/api/admin', requireRole('admin'), () => {
    return { message: '管理员专属内容' }
  })
  .get('/api/user', requireRole('user', 'admin'), () => {
    return { message: '用户专属内容' }
  })
```

---

## 密码安全

### 密码加密

```typescript
import bcrypt from 'bcryptjs'

// 密码哈希
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

// 验证密码
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 使用示例
app.post('/api/register', async ({ body }) => {
  const hashedPassword = await hashPassword(body.password)
  
  // 保存到数据库
  await db.user.create({
    data: {
      email: body.email,
      password: hashedPassword
    }
  })
  
  return { success: true }
})
```

### 密码策略

```typescript
import { t } from 'elysia'

app.post('/api/register', ({ body }) => {
  // 业务逻辑...
}, {
  body: t.Object({
    password: t.String({
      minLength: 8,
      maxLength: 128,
      // 自定义验证：至少包含大小写字母和数字
      // 可以在业务逻辑中进一步验证
    }),
    email: t.String({ format: 'email' })
  })
})
```

### 防止暴力破解

```typescript
// 登录尝试限制
const loginAttempts = new Map<string, { count: number; lockUntil: number }>()

app.post('/api/login', async ({ request, body, set }) => {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const attempt = loginAttempts.get(ip)
  
  if (attempt && Date.now() < attempt.lockUntil) {
    set.status = 429
    return { error: '尝试次数过多，请稍后再试' }
  }
  
  // 验证用户...
  const success = await validateUser(body)
  
  if (!success) {
    // 记录失败尝试
    if (!attempt) {
      loginAttempts.set(ip, { count: 1, lockUntil: Date.now() + 15 * 60 * 1000 })
    } else if (attempt.count >= 5) {
      // 锁定 15 分钟
      loginAttempts.set(ip, { count: attempt.count + 1, lockUntil: Date.now() + 15 * 60 * 1000 })
    } else {
      loginAttempts.set(ip, { count: attempt.count + 1, lockUntil: attempt.lockUntil })
    }
    set.status = 401
    return { error: '用户名或密码错误' }
  }
  
  // 成功登录，清除记录
  loginAttempts.delete(ip)
  return { token: '...' }
})
```

---

## 速率限制

### 基础速率限制

```typescript
import { Elysia } from 'elysia'

const requestCounts = new Map<string, { count: number; resetTime: number }>()

const app = new Elysia()
  .derive(({ request, set }) => {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 分钟
    const maxRequests = 100
    
    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs }
    
    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = now + windowMs
    }
    
    record.count++
    requestCounts.set(ip, record)
    
    if (record.count > maxRequests) {
      set.status = 429
      set.headers['Retry-After'] = Math.ceil((record.resetTime - now) / 1000).toString()
      return { error: '请求过于频繁' }
    }
    
    return { rateLimit: { remaining: maxRequests - record.count } }
  })
```

### 使用插件

```typescript
import { rateLimit } from '@elysiajs/rate-limit'

const app = new Elysia()
  .use(
    rateLimit({
      window: 1000 * 60, // 1 分钟
      max: 100, // 最多 100 次请求
      message: '请求过于频繁，请稍后再试'
    })
  )
```

---

## HTTPS 配置

### 强制 HTTPS

```typescript
app.derive(({ request, set }) => {
  const proto = request.headers.get('x-forwarded-proto')
  
  if (proto === 'http') {
    set.redirect = request.url.replace('http://', 'https://')
  }
})
```

### HSTS (HTTP Strict Transport Security)

```typescript
app.onRequest(({ set }) => {
  // 强制 HTTPS，有效期 2 年
  set.headers['Strict-Transport-Security'] = 
    'max-age=63072000; includeSubDomains; preload'
})
```

---

## 安全审计

### 依赖扫描

```bash
# 使用 npm
npm audit

# 自动修复
npm audit fix

# 使用 yarn
yarn audit

# 使用 Snyk
npx snyk test
```

### 安全 Headers 检查

```bash
# 使用 securityheaders.com 检查
curl -I https://yourdomain.com

# 使用 Mozilla Observatory
curl -I https://yourdomain.com | grep -E 'Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options'
```

### 定期检查清单

- [ ] 所有依赖已更新到最新版本
- [ ] 已配置 Helmet 安全头
- [ ] 已启用 HTTPS
- [ ] 已配置 CORS
- [ ] 已实现认证和授权
- [ ] 密码已加密存储
- [ ] 已配置速率限制
- [ ] 输入验证已实现
- [ ] 日志记录已配置
- [ ] 备份策略已实施

---

## 应急响应

### 安全事故响应流程

1. **立即止损**: 隔离 affected 系统
2. **收集证据**: 保存日志、截图
3. **分析原因**: 找出漏洞根源
4. **修复漏洞**: 发布安全补丁
5. **通知用户**: 如有数据泄露
6. **复盘总结**: 完善防护措施

### 紧急联系人

```typescript
// 安全联系人配置
const securityContacts = {
  security: 'security@yourcompany.com',
  emergency: '+86-xxx-xxxx-xxxx'
}
```

---

## 安全资源

### 学习资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/)
- [Security Headers](https://securityheaders.com/)

### 工具

- [npm audit](https://docs.npmjs.com/cli/v7/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [ZAP Proxy](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

---

祝你构建安全的 Web 应用！🔒
