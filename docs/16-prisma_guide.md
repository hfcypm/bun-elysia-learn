# Prisma orm 使用指南

## 快速开始

### 1. 安装依赖

```bash
# 安装 Prisma
bun install prisma @prisma/client

# 初始化 Prisma (如果还没有 schema 文件)
bun x prisma init
```

### 2. 配置数据库

编辑 `prisma/schema.prisma` 文件，设置数据库连接：

**sqlite (开发/测试推荐)**:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**postgresql (生产推荐)**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

对应的 `.env` 文件:
```
DATABASE_URL="postgresql://user:password@localhost:5432/elysia_db?schema=public"
```

### 3. 创建数据库迁移

```bash
# 创建并应用迁移 (开发环境)
bun x prisma migrate dev

# 仅生成迁移文件 (不应用)
bun x prisma migrate dev --create-only

# 应用所有待处理的迁移
bun x prisma migrate deploy
```

### 4. 生成 Prisma client

```bash
bun x prisma generate
```

每次修改 schema.prisma 后都需要重新生成。

### 5. 运行示例

```bash
bun run src/intermediate/08-prisma-orm.ts
```

## Prisma client 常用操作

### 创建记录

```typescript
// 单个创建
const user = await prisma.user.create({
  data: {
    username: 'john',
    email: 'john@example.com',
    password: 'hashed_password'
  }
})

// 批量创建
const result = await prisma.user.createMany({
  data: [
    { username: 'user1', email: 'user1@example.com', password: 'pass1' },
    { username: 'user2', email: 'user2@example.com', password: 'pass2' }
  ],
  skipDuplicates: true
})
```

### 查询记录

```typescript
// 获取所有
const users = await prisma.user.findMany()

// 带筛选
const users = await prisma.user.findMany({
  where: {
    role: 'admin'
  }
})

// 带关联
const users = await prisma.user.findMany({
  include: {
    posts: true
  }
})

// 获取单个
const user = await prisma.user.findUnique({
  where: { id: 1 }
})

// 按字段查询
const user = await prisma.user.findFirst({
  where: {
    username: 'john'
  }
})
```

### 更新记录

```typescript
// 更新单个
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: 'new@example.com'
  }
})

// 增量更新
await prisma.post.update({
  where: { id: 1 },
  data: {
    viewCount: { increment: 1 }
  }
})

// 批量更新
await prisma.user.updateMany({
  where: { role: 'user' },
  data: { role: 'member' }
})
```

### 删除记录

```typescript
// 删除单个
await prisma.user.delete({
  where: { id: 1 }
})

// 批量删除
await prisma.post.deleteMany({
  where: {
    status: 'draft'
  }
})
```

### 关联操作

```typescript
// 创建文章并关联标签
const post = await prisma.post.create({
  data: {
    title: 'My Post',
    content: 'Content...',
    authorId: 1,
    tags: {
      create: [
        { tag: { connect: { id: 1 } }},
        { tag: { connect: { id: 2 }}}
      ]
    }
  }
})

// 更新关联
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ id: 1 }, { id: 2 }]  // 替换所有关联
    }
  }
})
```

### 事务处理

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { username: 'new', email: 'new@example.com', password: 'pass' }
  })
  
  const post = await tx.post.create({
    data: { title: 'First Post', content: '...', authorId: user.id }
  })
  
  return { user, post }
})
```

### 聚合查询

```typescript
// 统计
const count = await prisma.user.count({
  where: { role: 'admin' }
})

// 聚合
const stats = await prisma.post.aggregate({
  _count: true,
  _avg: { viewCount: true },
  _sum: { viewCount: true }
})

// 分组
const groupStats = await prisma.post.groupBy({
  by: ['status'],
  _count: true,
  _avg: { viewCount: true }
})
```

## 常用查询模式

### 复杂筛选

```typescript
const posts = await prisma.post.findMany({
  where: {
    and: [
      { status: 'published' },
      { viewCount: { gte: 100 } }
    ],
    or: [
      { title: { contains: 'typescript' } },
      { content: { contains: 'typescript' } }
    ]
  }
})
```

### 分页查询

```typescript
const page = 2
const limit = 10

const posts = await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
```

### 嵌套关联查询

```typescript
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    author: {
      select: {
        username: true,
        email: true
      }
    },
    tags: true,
    comments: {
      include: {
        author: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }
  }
})
```

## Prisma Studio

```bash
# 打开可视化数据库管理界面
bun x prisma studio
```

访问 http://localhost:5555

## 最佳实践

1. **类型安全**: Prisma client 自动生成 typescript 类型
2. **连接池**: 生产环境配置合适的连接池大小
3. **日志**: 开发环境启用查询日志便于调试
4. **迁移**: 使用版本控制的迁移管理 schema 变更
5. **事务**: 涉及多表操作时使用事务保证一致性

## 常见问题

### Q: 如何修改已有的 schema？

```bash
# 1. 修改 schema.prisma
# 2. 创建迁移
bun x prisma migrate dev --name add_new_field
# 3. 重新生成 client
bun x prisma generate
```

### Q: sqlite 如何重置数据库？

```bash
# 删除数据库文件
rm prisma/dev.db

# 重新迁移
bun x prisma migrate dev
```

### Q: 如何查看生成的类型？

```bash
# 查看生成的 client 代码
node_modules/.prisma/client/index.d.ts
```

## 参考资料

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma client api](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
