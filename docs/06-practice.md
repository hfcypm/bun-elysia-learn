# 实战练习手册

通过完成这些练习，巩固 Elysia 框架的学习成果。

---

## Level 1 练习

### 练习 1.1: 扩展 Hello API

**目标**: 在 `01-hello.ts` 基础上添加新功能

**需求**:
1. 添加 `/api/time` 返回当前时间
2. 添加 `/api/calc` 接受 `a` 和 `b` 参数，返回两数之和
3. 添加 `/api/reverse/:text` 返回反转后的文本

**参考实现**:

```typescript
.get('/api/time', () => {
  return {
    now: new Date().toISOString(),
    timestamp: Date.now()
  }
})

.get('/api/calc', ({ query }) => {
  const a = query.a || 0
  const b = query.b || 0
  return {
    a,
    b,
    sum: a + b
  }
})

.get('/api/reverse/:text', ({ params }) => {
  const reversed = params.text.split('').reverse().join('')
  return {
    original: params.text,
    reversed
  }
})
```

---

### 练习 1.2: 图书管理 CRUD

**目标**: 创建图书管理系统

**需求**:
1. 创建 `todos.ts` 文件，实现图书 CRUD
2. 数据结构：id, title, author, publishedYear, isBorrowed
3. 实现接口: 列表、详情、创建、更新、删除、借阅、归还

**练习文件**: `src/practice/01-library.ts`

**提示**:
```typescript
interface Book {
  id: number
  title: string
  author: string
  publishedYear: number
  isBorrowed: boolean
}

// 需要实现的路由
.get('/books')              // 获取所有图书
.get('/books/:id')          // 获取单本图书
.post('/books')             // 添加图书
.put('/books/:id')          // 更新图书
.delete('/books/:id')       // 删除图书
.patch('/books/:id/borrow') // 借阅
.patch('/books/:id/return') // 归还
```

---

## Level 2 练习

### 练习 2.1: 邮箱订阅系统

**目标**: 实现带验证的邮箱订阅功能

**需求**:
1. 创建 `subscription.ts`
2. 验证邮箱格式、订阅类型、频率偏好
3. 实现订阅、取消订阅、查看订阅状态

**练习文件**: `src/practice/02-subscription.ts`

**验证规则**:
- 邮箱：必须符合邮箱格式
- 类型：news(新闻)、promo(促销)、weekly(周报)
- 频率：daily、weekly、monthly

**代码框架**:
```typescript
.post('/subscribe', ({ body }) => {
  // 验证并保存订阅
  return {
    success: true,
    message: '订阅成功',
    data: body
  }
}, {
  body: t.Object({
    email: t.String({ format: 'email' }),
    type: t.Union([
      t.Literal('news'),
      t.Literal('promo'),
      t.Literal('weekly')
    ]),
    frequency: t.Optional(t.Union([
      t.Literal('daily'),
      t.Literal('weekly'),
      t.Literal('monthly')
    ]))
  })
})
```

---

### 练习 2.2: API 限流中间件

**目标**: 实现请求限流功能

**需求**:
1. 创建 `rate-limit.ts` 中间件
2. 限制每个 IP 每分钟最多 10 次请求
3. 超出限制返回 429 状态码

**练习文件**: `src/practice/03-rate-limit.ts`

**参考实现**:
```typescript
const requestCounts = new Map<string, { count: number, resetTime: number }>()

app.derive(({ request, set }) => {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 分钟
  const maxRequests = 10

  const record = requestCounts.get(ip)

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return { rateLimit: { remaining: maxRequests - 1 } }
  }

  if (record.count >= maxRequests) {
    set.status = 429
    set.headers['Retry-After'] = Math.ceil((record.resetTime - now) / 1000).toString()
    return {
      success: false,
      message: '请求过于频繁，请稍后再试'
    }
  }

  record.count++
  return { rateLimit: { remaining: maxRequests - record.count } }
})
```

---

## Level 3 练习

### 练习 3.1: 电商商品 API

**目标**: 实现完整的商品管理系统

**需求**:
1. 创建 `ecommerce.ts`
2. 商品数据结构：id, name, description, price, stock, category, images, specs
3. 实现：商品 CRUD、库存管理、价格调整、商品搜索
4. 添加分类管理和标签系统

**练习文件**: `src/practice/04-ecommerce.ts`

**核心接口**:
```typescript
// 商品管理
GET    /products             商品列表（支持分页、筛选、排序）
GET    /products/:id         商品详情
POST   /products             创建商品
PUT    /products/:id         更新商品
DELETE /products/:id         删除商品

// 库存管理
PATCH  /products/:id/stock   调整库存
POST   /products/:id/stock   入库操作

// 价格管理
PUT    /products/:id/price   调整价格

// 搜索
GET    /search               商品搜索
```

**数据结构参考**:
```typescript
interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
  images: string[]
  specs: Record<string, string>
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}
```

---

### 练习 3.2: 任务协作平台

**目标**: 实现多用户任务管理系统

**需求**:
1. 创建 `task-platform.ts`
2. 用户系统（带 JWT 认证）
3. 项目管理、任务分配、状态跟踪
4. 评论和附件功能
5. 任务历史记录

**练习文件**: `src/practice/05-task-platform.ts`

**数据模型**:
```typescript
interface User {
  id: number
  username: string
  email: string
  avatar?: string
}

interface Project {
  id: number
  name: string
  description: string
  ownerId: number
  members: number[]
  createdAt: string
}

interface Task {
  id: number
  projectId: number
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: number
  reporterId: number
  dueDate?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface TaskComment {
  id: number
  taskId: number
  userId: number
  content: string
  createdAt: string
}
```

---

### 练习 3.3: 文件上传服务

**目标**: 实现文件上传和管理功能

**需求**:
1. 创建 `file-upload.ts`
2. 支持多文件上传
3. 文件类型验证（图片、文档）
4. 文件大小限制
5. 文件列表和删除

**练习文件**: `src/practice/06-file-upload.ts`

**提示**:
```typescript
import { Elysia, t } from 'elysia'

const uploadedFiles = new Map()

app
  // 单文件上传
  .post('/upload', async ({ body, set }) => {
    if (!body.avatar) {
      set.status = 400
      return { success: false, message: '请选择文件' }
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(body.avatar.type)) {
      set.status = 400
      return { success: false, message: '不支持的文件类型' }
    }

    // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024
    if (body.avatar.size > maxSize) {
      set.status = 400
      return { success: false, message: '文件超过 2MB' }
    }

    // 保存文件
    const fileId = Date.now().toString()
    uploadedFiles.set(fileId, {
      name: body.avatar.name,
      type: body.avatar.type,
      size: body.avatar.size,
      uploadedAt: new Date().toISOString()
    })

    return {
      success: true,
      message: '上传成功',
      data: {
        fileId,
        url: `/files/${fileId}`
      }
    }
  }, {
    body: t.Object({
      avatar: t.File()
    })
  })

  // 多文件上传
  .post('/upload/multiple', async ({ body }) => {
    const files = Array.isArray(body.files) ? body.files : [body.files]
    
    const results = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size
    }))

    return {
      success: true,
      message: `成功上传${results.length}个文件`,
      data: results
    }
  }, {
    body: t.Object({
      files: t.Array(t.File())
    })
  })
```

---

## 综合项目练习

### 项目：在线问卷调查系统

**目标**: 综合运用所学知识，完成一个完整的项目

**需求**:
1. 用户认证（注册、登录、JWT）
2. 问卷创建和编辑
3. 问题类型（单选、多选、填空、评分）
4. 问卷发布和分享
5. 回答收集和统计
6. 数据导出

**技术栈**:
- Elysia.js (后端框架)
- SQLite/PostgreSQL (数据库)
- JWT (认证)
- TypeBox (验证)

**核心功能**:
```
1. 用户系统
   - 注册/登录
   - 个人资料管理
   - 密码修改

2. 问卷管理
   - 创建问卷
   - 添加问题
   - 设置主题
   - 发布/下架

3. 回答收集
   - 公开链接
   - 匿名回答
   - 防重复提交

4. 数据统计
   - 实时统计
   - 图表展示
   - 数据导出 (CSV/Excel)
```

---

## 练习检查清单

完成每个练习后，检查以下项：

- [ ] 代码能正常运行
- [ ] 所有接口都能正确响应
- [ ] 验证规则生效
- [ ] 错误处理完善
- [ ] 类型定义准确
- [ ] 代码结构清晰

---

## 进阶挑战

完成基础练习后，尝试以下挑战：

1. **性能优化**
   - 实现响应缓存
   - 添加数据库连接池
   - 实现请求压缩

2. **安全加固**
   - 实现 CSRF 保护
   - 添加 SQL 注入防护
   - 实现 XSS 过滤

3. **可观测性**
   - 添加 Prometheus 指标
   - 实现分布式追踪
   - 结构化日志

4. **部署运维**
   - Docker 容器化
   - CI/CD 流程
   - 健康检查端点
