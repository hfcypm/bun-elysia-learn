# 阶段三：关联查询（一对多）

> 学习时间：3 小时 | 难度：⭐⭐⭐⭐

---

## 3.1 关系类型概述

### Prisma 支持的三种关系

| 关系类型 | 说明 | 示例 |
|----------|------|------|
| **一对一** | 一个 A 对应一个 B | 用户 - 个人资料 |
| **一对多** | 一个 A 对应多个 B | 用户 - 文章 |
| **多对多** | 多个 A 对应多个 B | 文章 - 标签 |

### 本章重点

本章重点学习**一对多关系**，这是实际开发中最常用的关系类型。

---

## 3.2 一对多关系定义

### schema 定义

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]   // 一个用户有多篇文章
}

model Post {
  id       Int   @id @default(autoincrement())
  title    String
  content  String
  authorId Int           // 外键
  author   User  @relation(fields: [authorId], references: [id])
}
```

### 关键语法解析

```prisma
// User 端：一对多
posts     Post[]  // 数组表示"多"

// Post 端：多对一
authorId  Int     // 外键字段
author    User    @relation(fields: [authorId], references: [id])
```

**说明：**
- `Post[]` - 数组表示一对多
- `@relation(fields: [authorId], references: [id])` - 定义外键关系

---

## 3.3 创建关联数据

### 方式一：连接已有记录

```typescript
// 创建文章时关联已有用户
const post = await prisma.post.create({
  data: {
    title: '我的文章',
    content: '文章内容...',
    author: {
      connect: { id: 1 }  // 连接到已存在的作者
    }
  }
});
```

### 方式二：同时创建关联

```typescript
// 创建用户的同时创建文章
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: '张三',
    posts: {
      create: [
        { title: '第一篇文章', content: '内容 1' },
        { title: '第二篇文章', content: '内容 2' }
      ]
    }
  },
  include: {
    posts: true  // 包含创建的关联数据
  }
});

console.log(user.posts);  // 可以看到创建的文章
```

### 方式三：先创建主体再添加关联

```typescript
// 1. 创建用户
const user = await prisma.user.create({
  data: { email: 'test@example.com', name: '张三' }
});

// 2. 为用户添加文章
const post = await prisma.post.create({
  data: {
    title: '文章标题',
    content: '文章内容',
    author: {
      connect: { id: user.id }
    }
  }
});
```

---

## 3.4 查询关联数据

### include 包含关联

```typescript
// 查询用户及其所有文章
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true  // 包含 posts 关联
  }
});

console.log(user);
// {
//   id: 1,
//   email: 'test@example.com',
//   posts: [
//     { id: 1, title: '...', content: '...' },
//     { id: 2, title: '...', content: '...' }
//   ]
// }
```

### 嵌套过滤

```typescript
// 查询用户及其已发布的文章
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: {
        status: 'PUBLISHED'  // 只包含已发布的
      },
      orderBy: {
        createdAt: 'desc'  // 按时间倒序
      }
    }
  }
});
```

### 嵌套分页

```typescript
// 查询用户的前 10 篇文章
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      take: 10,
      skip: 0,
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

### 嵌套 select

```typescript
// 只选择需要的字段
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    }
  }
});
```

---

## 3.5 反向关联查询

### 从"多"端查询"一"端

```typescript
// 查询文章及其作者
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    author: true  // 包含作者信息
  }
});

console.log(post.author);
// { id: 1, email: '...', name: '...' }
```

### 查询作者信息并过滤

```typescript
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    author: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
});
```

---

## 3.6 实战示例：博客系统

### 完整 schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  comments  Comment[]
  
  @@index([role])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  status    PostStatus @default(DRAFT)
  views     Int      @default(0)
  createdAt DateTime @default(now())
  
  // 关联
  authorId   Int
  author     User      @relation(fields: [authorId], references: [id])
  categoryId Int?
  category   Category? @relation(fields: [categoryId], references: [id])
  comments   Comment[]
  
  @@index([authorId])
  @@index([status])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  
  // 关联
  postId  Int
  post    Post  @relation(fields: [postId], references: [id])
  authorId Int
  author  User  @relation(fields: [authorId], references: [id])
  
  @@index([postId])
  @@index([authorId])
}

enum Role {
  USER
  ADMIN
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 实战操作

```typescript
// 1. 创建作者
const author = await prisma.user.create({
  data: {
    email: 'author@example.com',
    name: '博主',
    role: 'ADMIN'
  }
});

// 2. 创建文章（关联作者）
const post = await prisma.post.create({
  data: {
    title: 'Prisma 完全教程',
    slug: 'prisma-tutorial',
    content: '这是一篇详细的 Prisma 教程...',
    author: {
      connect: { id: author.id }
    }
  },
  include: {
    author: {
      select: { id: true, name: true }
    }
  }
});

// 3. 添加评论
const comment = await prisma.comment.create({
  data: {
    content: '写得很好！👍',
    post: {
      connect: { id: post.id }
    },
    author: {
      connect: { id: author.id }
    }
  },
  include: {
    author: { select: { name: true } },
    post: { select: { title: true } }
  }
});

// 4. 查询作者及其文章
const userWithPosts = await prisma.user.findUnique({
  where: { id: author.id },
  include: {
    posts: {
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    }
  }
});

// 5. 查询文章详情（含作者和评论）
const postDetail = await prisma.post.findUnique({
  where: { id: post.id },
  include: {
    author: {
      select: { id: true, name: true, email: true }
    },
    comments: {
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } }
      }
    }
  }
});
```

### 查询结果示例

```json
{
  "id": 1,
  "title": "Prisma 完全教程",
  "content": "...",
  "author": {
    "id": 1,
    "name": "博主",
    "email": "author@example.com"
  },
  "comments": [
    {
      "id": 1,
      "content": "写得很好！👍",
      "author": {
        "name": "博主"
      }
    }
  ]
}
```

---

## 3.7 嵌套更新和删除

### 嵌套创建

```typescript
// 创建用户时同时创建多篇文章
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: '张三',
    posts: {
      create: [
        { title: '文章 1', content: '内容 1' },
        { title: '文章 2', content: '内容 2' }
      ]
    }
  }
});
```

### 嵌套更新

```typescript
// 更新用户信息并为文章添加评论
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: '新名字',
    posts: {
      update: {
        where: { id: 1 },
        data: {
          comments: {
            create: { content: '新评论' }
          }
        }
      }
    }
  }
});
```

### 嵌套删除

```typescript
// 删除用户时删除其所有文章（需要在 schema 中配置级联）
const user = await prisma.user.delete({
  where: { id: 1 }
});

// schema 配置：
// model Post {
//   author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
// }
```

---

## 3.8 统计关联数量

### 使用 _count

```typescript
// 查询用户及其文章数、评论数
const user = await prisma.user.findMany({
  include: {
    _count: {
      select: {
        posts: true,
        comments: true
      }
    }
  }
});

// 结果示例
[
  {
    id: 1,
    email: 'user1@example.com',
    _count: { posts: 5, comments: 12 }
  }
]
```

### 条件统计

```typescript
// 只统计已发布的文章数
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    _count: {
      select: {
        posts: {
          where: { status: 'PUBLISHED' }
        }
      }
    }
  }
});
```

---

## 📝 练习 3.1：分类管理

**任务：** 实现文章分类系统

**要求：**
1. 定义 Category 模型（自关联树形结构）
2. 一个分类下可以有多篇文章
3. 支持父子分类
4. 查询分类及其文章数量

**schema 提示：**
```prisma
model Category {
  id       Int        @id @default(autoincrement())
  name     String
  slug     String     @unique
  parentId Int?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  posts    Post[]
}
```

**参考答案：** `examples/postgres-prisma/blog-system.ts`

---

## 📝 练习 3.2：评论系统

**任务：** 实现嵌套评论系统

**要求：**
1. 评论关联文章和用户
2. 支持回复（评论的评论）
3. 统计评论数
4. 查询文章时包含评论列表

**schema 提示：**
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  parentId  Int?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  postId    Int
  post      Post     @relation(...)
  authorId  Int
  author    User     @relation(...)
}
```

**参考答案：** `examples/postgres-prisma/blog-system.ts`

---

## 📝 练习 3.3：商品与订单

**任务：** 实现电商商品订单系统

**要求：**
1. 一个用户可以有多个订单
2. 一个订单可以有多个订单项
3. 查询用户订单时包含商品详情
4. 统计订单数量和总金额

**参考答案：** `examples/postgres-prisma/ecommerce-order.ts`

---

## 📚 阶段三总结

### 知识点回顾

| 知识点 | 重要程度 | 掌握要求 |
|--------|----------|----------|
| 一对多关系定义 | ⭐⭐⭐⭐⭐ | 精通 |
| connect/create 关联创建 | ⭐⭐⭐⭐⭐ | 精通 |
| include 包含关联 | ⭐⭐⭐⭐⭐ | 精通 |
| 嵌套过滤 | ⭐⭐⭐⭐ | 熟练 |
| 嵌套分页 | ⭐⭐⭐⭐ | 熟练 |
| 嵌套统计 (_count) | ⭐⭐⭐⭐ | 熟练 |
| 嵌套更新/删除 | ⭐⭐⭐ | 熟悉 |

### 下一步

完成本章后，你应该能够：
- ✅ 设计一对多关系的数据模型
- ✅ 创建和查询关联数据
- ✅ 进行嵌套过滤和统计

准备好进入**阶段四：高级关联（多对多）**！

---

## 🔗 参考资源

- [Prisma 关系文档](https://prisma.io/docs/concepts/components/prisma-schema/relations)
- [一对一关系](https://prisma.io/docs/concepts/components/prisma-schema/relations/one-to-one-relations)
- [一对多关系](https://prisma.io/docs/concepts/components/prisma-schema/relations/one-to-many-relations)
- [示例代码 - 博客系统](../../examples/postgres-prisma/blog-system.ts)
