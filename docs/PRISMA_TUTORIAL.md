# Prisma ORM 从入门到精通

> 一本全面的 Prisma 学习指南，通过实战案例掌握现代数据库开发

---

## 📚 目录

### 第一部分：基础入门
1. [Prisma 简介与安装](#01-prisma-简介与安装)
2. [第一个 Prisma 项目](#02-第一个-prisma-项目)
3. [数据模型定义](#03-数据模型定义)
4. [数据库迁移](#04-数据库迁移)

### 第二部分：CRUD 操作
5. [创建数据](#05-创建数据)
6. [查询数据](#06-查询数据)
7. [更新数据](#07-更新数据)
8. [删除数据](#08-删除数据)

### 第三部分：进阶操作
9. [关联查询](#09-关联查询)
10. [事务处理](#10-事务处理)
11. [聚合查询](#11-聚合查询)
12. [批量操作](#12-批量操作)

### 第四部分：实战案例
13. [案例 1: 博客系统](#案例 -1-博客系统)
14. [案例 2: 电商产品](#案例 -2-电商产品)
15. [案例 3: 书签管理系统](#案例 -3-书签管理系统)

---

## 01 Prisma 简介与安装

### 什么是 Prisma？

Prisma 是新一代的 ORM（对象关系映射）工具，为 Node.js 和 TypeScript 提供类型安全的数据库访问。

**核心优势**:
- ✅ **类型安全** - 自动生成 TypeScript 类型
- ✅ **直观语法** - 类似 JavaScript 对象的查询语法
- ✅ **自动迁移** - Schema 变更自动同步到数据库
- ✅ **可视化界面** - Prisma Studio 可视化数据管理
- ✅ **多数据库支持** - PostgreSQL, MySQL, SQLite, SQL Server, MongoDB

### 支持的数据库

| 数据库 | 支持版本 |
|--------|----------|
| PostgreSQL | 10+ |
| MySQL | 5.7+ / 8+ |
| SQLite | 3.x |
| SQL Server | 2019+ |
| MongoDB | 4.4+ |

### 安装 Prisma

```bash
# 1. 初始化项目
mkdir my-prisma-app && cd my-prisma-app
npm init -y

# 2. 安装 Prisma
npm install prisma --save-dev
npm install @prisma/client

# 3. 初始化 Prisma
npx prisma init
```

### 项目结构

```
my-prisma-app/
├── prisma/
│   ├── schema.prisma    # 数据模型定义
│   └── dev.db          # SQLite 数据库文件 (开发用)
├── node_modules/
├── package.json
└── .env                # 环境变量
```

### .env 配置

```env
# SQLite (开发推荐)
DATABASE_URL="file:./dev.db"

# PostgreSQL (生产推荐)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

---

## 02 第一个 Prisma 项目

### 步骤 1: 定义数据模型

编辑 `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 第一个模型：用户
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### 步骤 2: 创建数据库迁移

```bash
# 创建并应用迁移
npx prisma migrate dev --name init

# 查看生成的 SQL
npx prisma migrate dev --create-only
```

### 步骤 3: 生成 Prisma Client

```bash
npx prisma generate
```

### 步骤 4: 编写代码

创建 `index.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建用户
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User'
    }
  })

  console.log('创建的用户:', user)

  // 查询所有用户
  const users = await prisma.user.findMany()
  console.log('所有用户:', users)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### 步骤 5: 运行

```bash
npx ts-node index.ts
```

---

## 03 数据模型定义

### 字段类型

```prisma
model Example {
  // 基本类型
  id         Int      @id @default(autoincrement())
  name       String
  age        Int
  isActive   Boolean
  score      Float
  data       Json
  
  // 日期时间
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // 可选字段
  nickname   String?
  
  // 唯一约束
  email      String   @unique
  
  // 索引
  status     String   @index
}
```

### 字段属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `@id` | 主键 | `id Int @id` |
| `@default()` | 默认值 | `age Int @default(0)` |
| `@unique` | 唯一约束 | `email String @unique` |
| `@index` | 索引 | `status String @index` |
| `@updatedAt` | 自动更新时间 | `updatedAt DateTime @updatedAt` |
| `@map()` | 映射数据库列名 | `name String @map("user_name")` |
| `@db.VarChar()` | 指定数据库类型 | `name String @db.VarChar(100)` |

### 关系定义

#### 一对一

```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  profile  Profile?
}

model Profile {
  id      Int     @id @default(autoincrement())
  bio     String?
  userId  Int     @unique
  user    User    @relation(fields: [userId], references: [id])
}
```

#### 一对多

```prisma
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  posts    Post[]
}

model Post {
  id       Int     @id @default(autoincrement())
  title    String
  userId   Int
  user     User    @relation(fields: [userId], references: [id])
}
```

#### 多对多

```prisma
model Post {
  id       Int       @id @default(autoincrement())
  title    String
  tags     PostTag[]
}

model Tag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  posts     PostTag[]
}

model PostTag {
  postId    Int
  tagId     Int
  post      Post    @relation(fields: [postId], references: [id])
  tag       Tag     @relation(fields: [tagId], references: [id])
  
  @@id([postId, tagId])
}
```

---

## 04 数据库迁移

### 常用迁移命令

```bash
# 开发环境：创建并应用迁移
npx prisma migrate dev

# 仅创建迁移文件（不应用）
npx prisma migrate dev --create-only

# 生产环境：应用所有待处理迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 重置数据库
npx prisma migrate reset

# 为已有数据库生成迁移
npx prisma db pull
npx prisma migrate dev --name init
```

### 迁移文件结构

```
prisma/
└── migrations/
    └── 20240101120000_init/
        ├── migration.sql    # 生成的 SQL
        └── migration_lock.toml
```

### 迁移最佳实践

1. **命名规范**: 使用有意义的迁移名称
   ```bash
   npx prisma migrate dev --name add_user_profile
   ```

2. **版本控制**: 提交迁移文件到 Git
   ```bash
   git add prisma/migrations
   ```

3. **生产部署**: 使用 `migrate deploy` 而非 `migrate dev`
   ```bash
   npx prisma migrate deploy
   ```

---

## 05 创建数据

### 基础创建

```typescript
// 创建单条记录
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe'
  }
})
```

### 批量创建

```typescript
// 批量创建（同类型数据）
const result = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  skipDuplicates: true  // 跳过重复
})

console.log(`创建了 ${result.count} 个用户`)
```

### 带关联创建

```typescript
// 创建文章并关联标签
const post = await prisma.post.create({
  data: {
    title: 'My Post',
    content: 'Content...',
    userId: 1,
    tags: {
      create: [
        { tag: { connect: { id: 1 } }},
        { tag: { connect: { id: 2 }}}
      ]
    }
  },
  include: {
    tags: { include: { tag: true } }
  }
})
```

### 嵌套创建

```typescript
// 创建用户和资料
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    profile: {
      create: {
        bio: 'Software Developer',
        avatar: '/avatars/john.jpg'
      }
    }
  },
  include: {
    profile: true
  }
})
```

---

## 06 查询数据

### 基础查询

```typescript
// 查询所有
const users = await prisma.user.findMany()

// 查询单个（按 ID）
const user = await prisma.user.findUnique({
  where: { id: 1 }
})

// 查询单个（按条件）
const user = await prisma.user.findFirst({
  where: { email: 'john@example.com' }
})
```

### 条件查询

```typescript
// 精确匹配
const users = await prisma.user.findMany({
  where: {
    isActive: true
  }
})

// 模糊搜索
const users = await prisma.user.findMany({
  where: {
    name: {
      contains: 'John'
    }
  }
})

// 范围查询
const users = await prisma.user.findMany({
  where: {
    age: {
      gte: 18,  // >=
      lte: 65   // <=
    }
  }
})

// IN 查询
const users = await prisma.user.findMany({
  where: {
    id: {
      in: [1, 2, 3]
    }
  }
})

// 多条件组合
const posts = await prisma.post.findMany({
  where: {
    AND: [
      { published: true },
      { viewCount: { gte: 100 } }
    ],
    OR: [
      { title: { contains: 'TypeScript' } },
      { content: { contains: 'TypeScript' } }
    ]
  }
})
```

### 选择字段

```typescript
// 只选择需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
})
```

### 分页查询

```typescript
// 基础分页
const page = 2
const limit = 10

const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit
})

// 带总数
const [users, total] = await Promise.all([
  prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit
  }),
  prisma.user.count()
])

// 基于游标的分页
const posts = await prisma.post.findMany({
  take: 10,
  cursor: { id: lastPostId },
  orderBy: { createdAt: 'desc' }
})
```

### 排序

```typescript
// 单字段排序
const users = await prisma.user.findMany({
  orderBy: {
    createdAt: 'desc'
  }
})

// 多字段排序
const posts = await prisma.post.findMany({
  orderBy: [
    { published: 'desc' },
    { createdAt: 'desc' }
  ]
})
```

---

## 07 更新数据

### 基础更新

```typescript
// 更新单个记录
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Updated Name'
  }
})
```

### 批量更新

```typescript
// 更新多个记录
const result = await prisma.user.updateMany({
  where: {
    isActive: false
  },
  data: {
    isActive: true
  }
})

console.log(`更新了 ${result.count} 个用户`)
```

### 增量更新

```typescript
// 字段自增
await prisma.post.update({
  where: { id: 1 },
  data: {
    viewCount: { increment: 1 }
  }
})

// 其他操作
await prisma.post.update({
  where: { id: 1 },
  data: {
    score: { multiply: 2 },    // 乘法
    score: { divide: 2 },      // 除法
    tags: { set: ['new'] }     // 设置值
  }
})
```

### 更新关联

```typescript
// 更新一对一关联
await prisma.user.update({
  where: { id: 1 },
  data: {
    profile: {
      update: {
        bio: 'New bio'
      }
    }
  }
})

// 更新一对多关联
await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      create: {
        title: 'New Post',
        content: '...'
      }
    }
  }
})

// 更新多对多关联
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ id: 1 }, { id: 2 }],  // 替换所有
      connect: [{ id: 3 }],         // 添加
      disconnect: [{ id: 4 }]       // 移除
    }
  }
})
```

### 更新或创建

```typescript
// 存在则更新，不存在则创建
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: {
    name: 'Updated Name'
  },
  create: {
    email: 'john@example.com',
    name: 'John Doe'
  }
})
```

---

## 08 删除数据

### 基础删除

```typescript
// 删除单个记录
await prisma.user.delete({
  where: { id: 1 }
})
```

### 批量删除

```typescript
// 删除多个记录
const result = await prisma.user.deleteMany({
  where: {
    isActive: false
  }
})

console.log(`删除了 ${result.count} 个用户`)
```

### 级联删除

```prisma
// schema.prisma
model User {
  id     Int     @id
  posts  Post[]  @relation(onDelete: Cascade)
}

model Post {
  id     Int    @id
  userId Int
  user   User   @relation(fields: [userId], references: [id])
}
```

```typescript
// 删除用户时自动删除所有文章
await prisma.user.delete({
  where: { id: 1 }
})
```

---

## 09 关联查询

### Include 查询

```typescript
// 包含关联数据
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true
  }
})
```

### 嵌套 Include

```typescript
// 多层嵌套
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: {
        tags: {
          include: { tag: true }
        }
      }
    }
  }
})
```

### 过滤关联

```typescript
// 只包含已发布的文章
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: {
        published: true
      }
    }
  }
})
```

### 关联统计

```typescript
// 统计关联数量
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    _count: {
      select: {
        posts: true,
        comments: true
      }
    }
  }
})
```

---

## 10 事务处理

### 隐式事务

```typescript
// 批量操作自动在事务中
await prisma.post.createMany({
  data: [
    { title: 'Post 1', userId: 1 },
    { title: 'Post 2', userId: 1 }
  ]
})
```

### 显式事务

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 创建用户
  const user = await tx.user.create({
    data: {
      email: 'john@example.com',
      name: 'John'
    }
  })
  
  // 创建文章
  const post = await tx.post.create({
    data: {
      title: 'First Post',
      content: '...',
      userId: user.id
    }
  })
  
  // 创建标签关联
  await tx.postTag.create({
    data: {
      postId: post.id,
      tagId: 1
    }
  })
  
  return { user, post }
})
```

### 批量独立事务

```typescript
const [user1, user2, user3] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'user1@example.com' } }),
  prisma.user.create({ data: { email: 'user2@example.com' } }),
  prisma.user.create({ data: { email: 'user3@example.com' } })
])
```

---

## 11 聚合查询

### Count 统计

```typescript
// 统计总数
const count = await prisma.user.count()

// 条件统计
const count = await prisma.user.count({
  where: {
    isActive: true
  }
})
```

### Aggregate 聚合

```typescript
const stats = await prisma.post.aggregate({
  _count: true,
  _avg: {
    viewCount: true
  },
  _sum: {
    viewCount: true
  },
  _min: {
    createdAt: true
  },
  _max: {
    createdAt: true
  }
})
```

### GroupBy 分组

```typescript
const groupStats = await prisma.post.groupBy({
  by: ['userId'],
  _count: true,
  _avg: {
    viewCount: true
  },
  orderBy: {
    _count: 'desc'
  },
  having: {
    viewCount: {
      _avg: {
        gte: 100
      }
    }
  }
})
```

---

## 12 批量操作

### 批量创建

```typescript
const result = await prisma.user.createMany({
  data: users,
  skipDuplicates: true
})
```

### 批量更新

```typescript
// 条件批量更新
await prisma.user.updateMany({
  where: {
    role: 'guest'
  },
  data: {
    role: 'member'
  }
})
```

### 批量删除

```typescript
await prisma.user.deleteMany({
  where: {
    lastLoginAt: {
      lt: new Date('2023-01-01')
    }
  }
})
```

---

## 案例 1: 博客系统

完整代码：`examples/prisma-blog.ts`

### 数据模型

```prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String
  posts    Post[]
  comments Comment[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  comments  Comment[]
  tags      PostTag[]
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  postId    Int
  authorId  Int
  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}

model Tag {
  id     Int       @id @default(autoincrement())
  name   String    @unique
  posts  PostTag[]
}

model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id])
  tag    Tag  @relation(fields: [tagId], references: [id])
  @@id([postId, tagId])
}
```

### 核心操作示例

```typescript
// 创建并发布文章
const post = await prisma.post.create({
  data: {
    title: 'Prisma 教程',
    content: '...',
    authorId: 1,
    tags: {
      create: [
        { tag: { connect: { id: 1 } }},
        { tag: { connect: { id: 2 }}}
      ]
    }
  }
})

// 查询文章列表（带作者和标签）
const posts = await prisma.post.findMany({
  where: { published: true },
  include: {
    author: { select: { name: true } },
    tags: { include: { tag: true } },
    _count: { select: { comments: true } }
  },
  orderBy: { createdAt: 'desc' }
})

// 发表评论
const comment = await prisma.comment.create({
  data: {
    content: '好文章！',
    postId: 1,
    authorId: 2
  }
})
```

---

## 案例 2: 电商产品

完整代码：`examples/prisma-ecommerce.ts`

### 数据模型

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  category    Category?
  images      ProductImage[]
  orderItems  OrderItem[]
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  products Product[]
}

model ProductImage {
  id        Int      @id @default(autoincrement())
  url       String
  productId Int
  product   Product  @relation(fields: [productId], references: [id])
}

model Customer {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  orders   Order[]
}

model Order {
  id         Int        @id @default(autoincrement())
  customerId Int
  customer   Customer   @relation(fields: [customerId], references: [id])
  total      Float
  status     String     @default('pending')
  items      OrderItem[]
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  order     Order   @relation(fields: [orderId], references: [id])
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float
}
```

### 核心操作示例

```typescript
// 下单（事务）
const order = await prisma.$transaction(async (tx) => {
  // 创建订单
  const newOrder = await tx.order.create({
    data: {
      customerId: 1,
      total: 0,
      status: 'pending'
    }
  })
  
  // 添加订单项
  for (const item of items) {
    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }
    })
    
    // 扣减库存
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity }
      }
    })
  }
  
  // 计算总价
  const orderItems = await tx.orderItem.findMany({
    where: { orderId: newOrder.id },
    include: { product: true }
  })
  
  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  )
  
  await tx.order.update({
    where: { id: newOrder.id },
    data: { total }
  })
  
  return newOrder
})

// 查询订单详情
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    customer: true,
    items: {
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        }
      }
    }
  }
})
```

---

## 案例 3: 书签管理系统

完整代码：`src/advanced/bookmark-system.ts`

这是一个完整的 CRUD 系统，包含：
- 用户管理
- 书签 CRUD
- 收藏夹管理
- 标签系统
- 评论功能
- 统计搜索

详见 `src/advanced/bookmark-system.ts` 和 `docs/BOOKMARK_SYSTEM_GUIDE.md`

---

## 附录：常用命令速查

```bash
# 开发
npx prisma migrate dev              # 创建并应用迁移
npx prisma generate                 # 生成 Client
npx prisma studio                   # 可视化界面

# 生产
npx prisma migrate deploy           # 部署迁移

# 调试
npx prisma db seed                  # 播种数据
npx prisma db pull                  # 从数据库导入 schema
npx prisma db push                  # 推送 schema 到数据库
```

---

## 附录：错误代码速查

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| P2002 | 唯一约束冲突 | 检查重复数据 |
| P2003 | 外键约束冲突 | 检查关联数据 |
| P2025 | 记录不存在 | 确认 where 条件 |
| P2004 | 类型转换错误 | 检查数据类型 |

---

**文档版本**: 1.0  
**更新日期**: 2026-05-31  
**相关案例**: `src/advanced/bookmark-system.ts`
