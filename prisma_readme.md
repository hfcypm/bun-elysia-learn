# Prisma orm 案例补充说明

## 📦 新增文件

### 1. 主案例代码
- **文件**: `src/intermediate/08-prisma-orm.ts`
- **端口**: 3020
- **代码行数**: ~900 行

### 2. Prisma schema
- **文件**: `prisma/schema.prisma`
- **数据库**: sqlite (可切换到 postgresql)

### 3. 使用指南
- **文件**: `docs/PRISMA_GUIDE.md`
- **内容**: 完整的 Prisma 使用教程

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /workspace
bun install prisma @prisma/client
```

### 2. 初始化数据库

```bash
# 如果还没有 prisma 目录，复制 schema 文件
cp prisma/schema.prisma prisma/schema.prisma

# 初始化 sqlite 数据库
bun x prisma migrate dev --name init

# 生成 Prisma client
bun x prisma generate
```

### 3. 运行示例

```bash
bun run src/intermediate/08-prisma-orm.ts
```

访问 http://localhost:3020

---

## 📖 api 端点

### 用户模块
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/users` | 获取所有用户 (含文章统计) |
| GET | `/users/:id` | 获取用户详情 (含文章和标签) |
| GET | `/users/username/:username` | 按用户名查询 |
| POST | `/users` | 创建用户 |
| PUT | `/users/:id` | 更新用户 |
| DELETE | `/users/:id` | 删除用户 |

### 文章模块
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/posts` | 获取文章列表 (筛选/分页/搜索) |
| GET | `/posts?status=published` | 已发布文章 |
| GET | `/posts?tag=typescript` | 按标签筛选 |
| GET | `/posts/:id` | 文章详情 (含作者/标签/评论) |
| POST | `/posts` | 创建文章 (带标签关联) |
| PUT | `/posts/:id` | 更新文章 |
| DELETE | `/posts/:id` | 删除文章 |

### 标签模块
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/tags` | 获取所有标签 (含文章数统计) |
| POST | `/tags` | 创建标签 |

### 评论模块
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/posts/:postId/comments` | 获取评论列表 |
| POST | `/posts/:postId/comments` | 创建评论 |

### 数据库管理
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/db/stats` | 统计信息 |
| GET | `/db/advanced-query` | 高级查询示例 |
| POST | `/db/transaction-example` | 事务操作示例 |
| POST | `/db/batch-create` | 批量创建示例 |
| POST | `/db/reset` | 重置数据库 |

---

## 💡 Prisma 核心知识点

### 1. schema 定义

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  posts     Post[]   // 一对多关联
  comments  Comment[]
}

model Post {
  id       Int       @id @default(autoincrement())
  title    String
  author   User      @relation(fields: [authorId], references: [id])
  tags     PostTag[] // 多对多关联
}
```

### 2. crud 操作

```typescript
// Create
await prisma.user.create({
  data: { username: 'john', email: 'john@example.com' }
})

// Read
await prisma.user.findMany({
  where: { role: 'admin' },
  include: { posts: true }
})

// Update
await prisma.post.update({
  where: { id: 1 },
  data: { title: 'New Title' }
})

// Delete
await prisma.post.delete({
  where: { id: 1 }
})
```

### 3. 关联查询

```typescript
// Include - 包含关联数据
const users = await prisma.user.findMany({
  include: {
    posts: {
      include: { tags: true }
    }
  }
})

// Select - 选择特定字段
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    username: true,
    posts: {
      select: { title: true }
    }
  }
})
```

### 4. 多对多关系

```typescript
// 创建文章并关联标签
const post = await prisma.post.create({
  data: {
    title: 'My Post',
    tags: {
      create: [
        { tag: { connect: { id: 1 } }},
        { tag: { connect: { id: 2 }}}
      ]
    }
  }
})
```

### 5. 事务处理

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({...})
  const post = await tx.post.create({ authorId: user.id })
  return { user, post }
})
```

### 6. 聚合查询

```typescript
// 统计
const count = await prisma.post.count()

// 聚合
const stats = await prisma.post.aggregate({
  _avg: { viewCount: true },
  _sum: { viewCount: true }
})

// 分组
const groupStats = await prisma.post.groupBy({
  by: ['status'],
  _count: true
})
```

---

## 🎯 与原生 sql 的对比

### 原生 sqlite 示例

```typescript
// 查询用户及其文章
const users = db.prepare(`
  SELECT u.*, p.title as post_title
  FROM users u
  LEFT JOIN posts p ON u.id = p.author_id
  WHERE u.id = ?
`).get(userId)

// 创建文章
db.prepare(`
  INSERT INTO posts (title, content, author_id)
  VALUES (?, ?, ?)
`).run(title, content, authorId)
```

### Prisma 示例

```typescript
// 查询用户及其文章
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true }
})

// 创建文章
await prisma.post.create({
  data: { title, content, authorId }
})
```

**Prisma 优势**:
- ✅ 类型安全 (IntelliSense 支持)
- ✅ 无需手写 sql
- ✅ 自动处理关联
- ✅ 内置迁移管理
- ❌ 性能略低于原生 sql
- ❌ 学习曲线稍陡

---

## 🛠️ 常用命令

```bash
# 开发
bun x prisma migrate dev              # 创建并应用迁移
bun x prisma generate                 # 生成 Prisma client
bun x prisma studio                   # 可视化界面

# 生产
bun x prisma migrate deploy           # 应用所有迁移

# 调试
bun x prisma db seed                  # 播种数据
bun x prisma db pull                  # 从数据库拉取 schema
bun x prisma db push                  # 推送 schema 到数据库
```

---

## 📚 学习资源

1. **官方文档**: https://www.prisma.io/docs
2. **schema 参考**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
3. **client api**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
4. **本项目案例**: `src/intermediate/08-prisma-orm.ts`
5. **使用指南**: `docs/PRISMA_GUIDE.md`

---

## 🔧 切换到 postgresql

1. 修改 `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. 设置 `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/elysia_db"
```

3. 重新迁移:
```bash
bun x prisma migrate dev --name switch_to_postgres
bun x prisma generate
```

---

**更新**: 2026-05-31
**案例位置**: `src/intermediate/08-prisma-orm.ts`
