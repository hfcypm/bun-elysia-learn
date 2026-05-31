# 🔖 书签管理系统 - 综合案例指南

## 项目简介

这是一个基于 **Elysia.js + Prisma ORM** 的完整在线书签管理系统，实现了从数据库设计到 API 开发的全流程，是学习现代 Web 开发的综合实践案例。

## 系统功能

### 核心模块

| 模块 | 功能 | API 端点 |
|------|------|----------|
| 用户管理 | 注册、资料、删除 | `/api/users` |
| 书签管理 | CRUD、批量导入、搜索筛选 | `/api/bookmarks` |
| 收藏夹 | 创建、分类、关联书签 | `/api/collections` |
| 标签系统 | 标签管理、多标签关联 | `/api/tags` |
| 评论系统 | 书签评论、互动 | `/api/comments` |
| 统计分析 | 数据概览、热门排行 | `/api/stats` |
| 全局搜索 | 跨模块搜索 | `/api/search` |

---

## 快速开始

### 1. 安装依赖

```bash
cd /workspace
bun install prisma @prisma/client
```

### 2. 配置数据库

```bash
# 复制书签系统 schema
cp prisma/schema-bookmark.prisma prisma/schema.prisma

# 初始化数据库
bun x prisma migrate dev --name init

# 生成 Prisma Client
bun x prisma generate
```

### 3. 运行系统

```bash
bun run src/advanced/bookmark-system.ts
```

访问 http://localhost:3021

### 4. 初始化测试数据

```bash
# 使用 Postman 或 curl
curl -X POST http://localhost:3021/api/db/seed
```

---

## API 使用示例

### 用户管理

#### 创建用户

```bash
curl -X POST http://localhost:3021/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "bio": "书签爱好者"
  }'
```

#### 获取用户列表

```bash
curl http://localhost:3021/api/users?page=1&limit=10
```

### 书签管理

#### 创建书签

```bash
curl -X POST http://localhost:3021/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "GitHub",
    "url": "https://github.com",
    "description": "代码托管平台",
    "userId": 1,
    "tagIds": [1, 2]
  }'
```

#### 搜索书签

```bash
# 按关键词搜索
curl "http://localhost:3021/api/bookmarks?search=TypeScript"

# 按标签筛选
curl "http://localhost:3021/api/bookmarks?tagId=1"

# 获取收藏
curl "http://localhost:3021/api/bookmarks?isFavorite=true"

# 分页查询
curl "http://localhost:3021/api/bookmarks?page=1&limit=20&sortBy=createdAt&sortOrder=desc"
```

#### 更新书签

```bash
# 部分更新
curl -X PATCH http://localhost:3021/api/bookmarks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isFavorite": true
  }'
```

### 收藏夹管理

#### 创建收藏夹

```bash
curl -X POST http://localhost:3021/api/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "学习资源",
    "description": "各类教程",
    "color": "#2196F3",
    "userId": 1
  }'
```

#### 添加书签到收藏夹

```bash
curl -X POST http://localhost:3021/api/collections/1/bookmarks/1
```

### 标签管理

#### 创建标签

```bash
curl -X POST http://localhost:3021/api/tags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "前端开发",
    "color": "#E91E63"
  }'
```

### 评论功能

#### 发表评论

```bash
curl -X POST http://localhost:3021/api/bookmarks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "authorId": 1,
    "content": "这个书签很有用！"
  }'
```

### 统计与搜索

#### 查看系统统计

```bash
curl http://localhost:3021/api/stats
```

响应示例:
```json
{
  "success": true,
  "overview": {
    "users": 5,
    "bookmarks": 120,
    "collections": 15,
    "tags": 25,
    "comments": 45,
    "favorites": 30,
    "archived": 10
  },
  "topTags": [...],
  "topUsers": [...],
  "recentBookmarks": [...]
}
```

#### 全局搜索

```bash
curl "http://localhost:3021/api/search?q=TypeScript&type=all"
```

---

## 数据模型关系

```
User (用户)
├── Bookmarks (书签) - 一对多
├── Collections (收藏夹) - 一对多
└── Comments (评论) - 一对多

Bookmark (书签)
├── User (所有者) - 多对一
├── Tags (标签) - 多对多 (通过 BookmarkTag)
├── Collections (收藏夹) - 多对多 (通过 CollectionBookmark)
└── Comments (评论) - 一对多

Collection (收藏夹)
├── User (所有者) - 多对一
└── Bookmarks (书签) - 多对多

Tag (标签)
└── Bookmarks (书签) - 多对多

Comment (评论)
├── Bookmark (所属书签) - 多对一
└── User (作者) - 多对一
```

---

## Prisma 核心操作

### 1. 创建记录

```typescript
// 简单创建
const user = await prisma.user.create({
  data: {
    username: 'john',
    email: 'john@example.com',
    password: 'hashed'
  }
})

// 带关联创建
const bookmark = await prisma.bookmark.create({
  data: {
    title: 'GitHub',
    url: 'https://github.com',
    userId: 1,
    tags: {
      create: [
        { tagId: 1 },
        { tagId: 2 }
      ]
    }
  }
})
```

### 2. 查询记录

```typescript
// 查询所有
const bookmarks = await prisma.bookmark.findMany({
  include: {
    user: true,
    tags: { include: { tag: true } }
  }
})

// 条件查询
const favorites = await prisma.bookmark.findMany({
  where: {
    userId: 1,
    isFavorite: true
  }
})

// 模糊搜索
const results = await prisma.bookmark.findMany({
  where: {
    OR: [
      { title: { contains: 'TypeScript' } },
      { description: { contains: 'TypeScript' } }
    ]
  }
})
```

### 3. 更新记录

```typescript
// 完整更新
await prisma.bookmark.update({
  where: { id: 1 },
  data: {
    title: 'New Title',
    description: 'Updated'
  }
})

// 增量更新
await prisma.bookmark.update({
  where: { id: 1 },
  data: {
    visitCount: { increment: 1 }
  }
})

// 批量更新
await prisma.bookmark.updateMany({
  where: { userId: 1 },
  data: { isArchived: true }
})
```

### 4. 删除记录

```typescript
// 单个删除
await prisma.bookmark.delete({
  where: { id: 1 }
})

// 批量删除
await prisma.bookmark.deleteMany({
  where: {
    isArchived: true,
    userId: 1
  }
})
```

### 5. 事务操作

```typescript
await prisma.$transaction(async (tx) => {
  // 创建书签
  const bookmark = await tx.bookmark.create({...})
  
  // 关联标签
  await tx.bookmarkTag.createMany({
    data: tagIds.map(tagId => ({
      bookmarkId: bookmark.id,
      tagId
    }))
  })
  
  // 更新收藏夹
  await tx.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() }
  })
})
```

### 6. 聚合查询

```typescript
// 统计
const count = await prisma.bookmark.count({
  where: { userId: 1 }
})

// 聚合
const stats = await prisma.bookmark.aggregate({
  _count: true,
  _avg: { visitCount: true },
  _sum: { visitCount: true }
})

// 分组
const groupStats = await prisma.bookmark.groupBy({
  by: ['userId'],
  _count: true,
  orderBy: { _count: 'desc' }
})
```

---

## 高级功能

### 1. 复杂筛选

```typescript
const bookmarks = await prisma.bookmark.findMany({
  where: {
    AND: [
      { userId: 1 },
      { isArchived: false },
      {
        OR: [
          { isFavorite: true },
          { visitCount: { gte: 10 } }
        ]
      }
    ],
    tags: {
      some: {
        tag: {
          name: 'TypeScript'
        }
      }
    }
  }
})
```

### 2. 分页查询

```typescript
const page = 2
const limit = 20

const bookmarks = await prisma.bookmark.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})

const total = await prisma.bookmark.count()
```

### 3. 嵌套关联查询

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    username: true,
    bookmarks: {
      where: { isFavorite: true },
      include: {
        tags: { include: { tag: true } },
        collections: { include: { collection: true } }
      },
      take: 10
    },
    _count: {
      select: {
        bookmarks: true,
        collections: true
      }
    }
  }
})
```

---

## 最佳实践

### 1. 错误处理

```typescript
try {
  const user = await prisma.user.create({...})
} catch (error: any) {
  if (error.code === 'P2002') {
    // 唯一约束冲突
    return { error: '用户名已存在' }
  }
  if (error.code === 'P2025') {
    // 记录不存在
    return { error: '用户不存在' }
  }
  throw error
}
```

### 2. 性能优化

```typescript
// 只选择需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true
  }
})

// 避免 N+1 查询
const bookmarks = await prisma.bookmark.findMany({
  include: {
    user: true,  // 一次性加载关联数据
    tags: true
  }
})
```

### 3. 数据验证

```typescript
// API 层面验证
body: t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  url: t.String({ minLength: 1, maxLength: 2048, format: 'uri' }),
  userId: t.Number()
})
```

---

## 扩展建议

### 功能扩展

1. **用户认证**: 添加 JWT 认证中间件
2. **书签预览**: 抓取网页标题和描述
3. **导入导出**: 支持 HTML 书签文件导入
4. **分享功能**: 生成公开分享链接
5. **标签建议**: 基于内容的智能标签推荐
6. **定时备份**: 定期备份用户数据

### 性能优化

1. **数据库索引**: 为常用查询字段添加索引
2. **缓存**: 使用 Redis 缓存热点数据
3. **CDN**: 静态资源使用 CDN 加速
4. **分页**: 大数据量时优化分页查询

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/advanced/bookmark-system.ts` | 主案例代码 (~1500 行) |
| `prisma/schema-bookmark.prisma` | 数据模型定义 |
| `docs/BOOKMARK_SYSTEM_GUIDE.md` | 本使用指南 |

---

## 学习路线

1. **理解数据模型**: 阅读 schema 文件，理解表关系
2. **运行系统**: 启动服务，初始化测试数据
3. **测试 API**: 使用 Postman 测试所有端点
4. **阅读代码**: 理解 Prisma 各种操作方法
5. **修改扩展**: 尝试添加新功能
6. **性能优化**: 分析查询，优化性能

---

**案例位置**: `src/advanced/bookmark-system.ts`  
**运行端口**: 3021  
**代码行数**: ~1500 行  
**更新日期**: 2026-05-31
