# 阶段二：crud 基础操作

> 学习时间：3 小时 | 难度：⭐⭐⭐

---

## 2.1 Prisma client 基础

### 初始化 Prisma client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 使用示例
async function main() {
  // 数据库操作
  const user = await prisma.user.create({...});
}

// 程序结束时断开连接
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Prisma client api 分类

```
prisma.model.create()      // 创建单条记录
prisma.model.createMany()  // 批量创建

prisma.model.findUnique()  // 通过唯一 id 查询
prisma.model.findFirst()   // 查询第一条
prisma.model.findMany()    // 查询多条（列表）

prisma.model.update()      // 更新单条
prisma.model.updateMany()  // 批量更新

prisma.model.delete()      // 删除单条
prisma.model.deleteMany()  // 批量删除

prisma.model.count()       // 计数
prisma.model.aggregate()   // 聚合查询
prisma.model.groupBy()     // 分组查询
```

---

## 2.2 创建（Create）操作

### 创建单条记录

```typescript
// 示例代码：examples/postgres-prisma/auth-system.ts

// 基础创建
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    password: 'hashed_password',
    name: '测试用户',
    role: 'USER'
  }
});

console.log('创建成功:', user);
```

**返回结果：**
```json
{
  "id": 1,
  "email": "test@example.com",
  "password": "hashed_password",
  "name": "测试用户",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 创建并返回指定字段

```typescript
// 只返回需要的字段（提高性能）
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    password: 'hashed_password',
    name: '测试用户'
  },
  select: {
    id: true,
    email: true,
    name: true,
    role: true
  }
});

console.log(user);
// { id: 1, email: '...', name: '...', role: 'USER' }
```

### 创建并包含关联数据

```typescript
// 创建文章时同时包含作者信息
const post = await prisma.post.create({
  data: {
    title: '我的第一篇文章',
    content: '文章内容...',
    author: {
      connect: { id: 1 }  // 关联已存在的作者
    },
    category: {
      create: {
        name: '技术',
        slug: 'tech'
      }
    }
  },
  include: {
    author: true,
    category: true
  }
});
```

### 批量创建

```typescript
// 一次性创建多个用户
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', password: 'pwd1', name: '用户 1' },
    { email: 'user2@example.com', password: 'pwd2', name: '用户 2' },
    { email: 'user3@example.com', password: 'pwd3', name: '用户 3' }
  ]
});

console.log(`创建了 ${users.count} 个用户`);
```

**跳过重复记录：**
```typescript
const users = await prisma.user.createMany({
  data: [...],
  skipDuplicates: true  // 跳过已存在的 email
});
```

---

## 2.3 查询（Read）操作

### 查询单条记录

```typescript
// 通过唯一 id 查询
const user = await prisma.user.findUnique({
  where: { id: 1 }
});

// 通过唯一字段查询
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});
```

### 查询第一条记录

```typescript
// 查询满足条件的第一条
const firstAdmin = await prisma.user.findFirst({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'asc' }
});

// 无记录时返回 null（不抛出异常）
```

### 查询多条记录（列表）

```typescript
// 查询所有用户
const users = await prisma.user.findMany();

// 条件查询
const activeUsers = await prisma.user.findMany({
  where: { isActive: true }
});

// 多条件组合
const filteredUsers = await prisma.user.findMany({
  where: {
    role: 'USER',
    isActive: true,
    createdAt: {
      gte: new Date('2024-01-01')
    }
  }
});
```

### 条件操作符

```typescript
// 比较操作符
where: {
  age: { gt: 18 },        // 大于
  price: { gte: 100 },    // 大于等于
  stock: { lt: 10 },      // 小于
  rating: { lte: 5 },     // 小于等于
  id: { not: 1 }          // 不等于
}

// 字符串匹配
where: {
  title: { contains: 'Prisma' },     // 包含
  email: { startsWith: 'admin' },    // 开头
  name: { endsWith: '公司' }         // 结尾
}

// 枚举和列表
where: {
  role: { in: ['USER', 'ADMIN'] },   // 在列表中
  status: { notIn: ['DELETED'] }     // 不在列表中
}

// 空值判断
where: {
  publishedAt: { not: null },        // 不为空
  deletedAt: { equals: null }        // 为空
}
```

### 逻辑运算符

```typescript
// and（与）- 所有条件都要满足
const users = await prisma.user.findMany({
  where: {
    and: [
      { role: 'USER' },
      { isActive: true }
    ]
  }
});

// or（或）- 任一条件满足
const users = await prisma.user.findMany({
  where: {
    or: [
      { role: 'ADMIN' },
      { role: 'MODERATOR' }
    ]
  }
});

// not（非）- 条件不满足
const users = await prisma.user.findMany({
  where: {
    not: {
      role: 'BANNED'
    }
  }
});

// 简写形式（默认 and）
const users = await prisma.user.findMany({
  where: {
    role: 'USER',      // 隐式 and
    isActive: true
  }
});
```

---

## 2.4 选择字段和关联

### 只查询需要的字段

```typescript
// select: 只返回指定字段
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    name: true
  }
});

// 对比：include 会包含所有字段 + 关联
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true  // 包含关联的 posts
  }
});
```

### 包含关联数据

```typescript
// 查询用户及其所有文章
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true
  }
});

// 包含关联并过滤
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: {
        status: 'PUBLISHED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    }
  }
});
```

---

## 2.5 分页查询

### offset-limit 分页

```typescript
// 第 1 页，每页 10 条
const page1 = await prisma.user.findMany({
  skip: 0,
  take: 10
});

// 第 2 页，每页 10 条
const page2 = await prisma.user.findMany({
  skip: 10,
  take: 10
});

// 通用分页函数
async function getUsers(page: number = 1, limit: number = 10) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);
  
  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

### cursor 分页（高性能）

```typescript
// 基于游标的分页（适合大数据量）
const posts = await prisma.post.findMany({
  take: 10,
  orderBy: { createdAt: 'desc' },
  cursor: { id: lastSeenId },  // 从最后一条开始
  skip: 1  // 跳过游标本身
});
```

---

## 2.6 排序

```typescript
// 单字段排序
const users = await prisma.user.findMany({
  orderBy: {
    createdAt: 'desc'
  }
});

// 多字段排序
const products = await prisma.product.findMany({
  orderBy: [
    { category: 'asc' },
    { price: 'desc' },
    { sales: 'desc' }
  ]
});
```

---

## 2.7 更新（Update）操作

### 更新单条记录

```typescript
// 基础更新
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: '新名字',
    email: 'new@example.com'
  }
});
```

### 字段自增/自减

```typescript
// 库存增加
const product = await prisma.product.update({
  where: { id: 1 },
  data: {
    stock: { increment: 10 }  // 增加 10
  }
});

// 库存减少
const product = await prisma.product.update({
  where: { id: 1 },
  data: {
    stock: { decrement: 5 }  // 减少 5
  }
});

// 累加分数
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    score: { multiply: 2 }  // 分数翻倍
  }
});
```

### 批量更新

```typescript
// 更新所有满足条件的记录
const result = await prisma.user.updateMany({
  where: {
    role: 'USER',
    isActive: false
  },
  data: {
    isActive: true
  }
});

console.log(`更新了 ${result.count} 条记录`);
```

### 条件更新

```typescript
// 只更新为 null 的字段
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    avatar: {
      set: 'https://example.com/avatar.jpg'
    },
    phone: {
      set: '123456789'
    }
  }
});
```

---

## 2.8 删除（Delete）操作

### 删除单条记录

```typescript
// 删除并返回删除的数据
const user = await prisma.user.delete({
  where: { id: 1 }
});
```

### 批量删除

```typescript
// 删除所有满足条件的记录
const result = await prisma.user.deleteMany({
  where: {
    role: 'BANNED',
    lastLogin: {
      lt: new Date('2023-01-01')
    }
  }
});

console.log(`删除了 ${result.count} 条记录`);
```

### 级联删除

```prisma
// schema 中定义级联删除
model User {
  posts Post[] @relationonDeleteCascade
}

model Post {
  author User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

当删除用户时，其所有文章自动删除。

---

## 2.9 聚合与统计

### 计数

```typescript
// 统计总数
const totalUsers = await prisma.user.count();

// 条件计数
const activeUsers = await prisma.user.count({
  where: { isActive: true }
});

// 分组计数
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: true
});
```

### 聚合函数

```typescript
// 求和、平均、最大、最小
const stats = await prisma.order.aggregate({
  _sum: {
    totalAmount: true
  },
  _avg: {
    totalAmount: true
  },
  _min: {
    totalAmount: true
  },
  _max: {
    totalAmount: true
  }
});

console.log('总销售额:', stats._sum.totalAmount);
console.log('平均客单价:', stats._avg.totalAmount);
console.log('最高订单:', stats._max.totalAmount);
console.log('最低订单:', stats._min.totalAmount);
```

### 分组查询

```typescript
// 按角色分组统计
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  where: {
    isActive: true
  },
  _count: true,
  _avg: {
    age: true
  },
  orderBy: {
    _count: 'desc'
  }
});

// 结果示例
[
  { role: 'USER', _count: 100, _avg: { age: 28.5 } },
  { role: 'ADMIN', _count: 5, _avg: { age: 32.1 } }
]
```

---

## 📝 练习 2.1：用户管理 crud

**任务：** 实现完整的用户管理功能

**要求：**
1. 创建用户（包含密码加密）
2. 查询用户列表（分页）
3. 更新用户信息
4. 删除用户

**提示：** 参考 `examples/postgres-prisma/auth-system.ts`

**答案代码框架：**
```typescript
// 1. 创建
const user = await prisma.user.create({
  data: { email, password: hashed, name },
  select: { id: true, email: true, name: true }
});

// 2. 分页查询
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// 3. 更新
const user = await prisma.user.update({
  where: { id },
  data: { name, avatar }
});

// 4. 删除
await prisma.user.delete({
  where: { id }
});
```

---

## 📝 练习 2.2：商品管理 crud

**任务：** 实现电商商品管理

**要求：**
1. 创建商品（包含价格和库存）
2. 查询商品列表（支持筛选）
3. 更新库存（自增/自减）
4. 上架/下架商品

**提示：** 参考 `examples/postgres-prisma/ecommerce-order.ts`

---

## 📝 练习 2.3：文章管理系统

**任务：** 实现博客文章管理

**要求：**
1. 创建文章
2. 分页查询（包含作者信息）
3. 更新文章内容
4. 发布/归档文章

**提示：** 参考 `examples/postgres-prisma/blog-system.ts`

---

## 📚 阶段二总结

### 知识点回顾

| 知识点 | 重要程度 | 掌握要求 |
|--------|----------|----------|
| 创建操作（create/createMany） | ⭐⭐⭐⭐⭐ | 精通 |
| 查询操作（findUnique/findMany） | ⭐⭐⭐⭐⭐ | 精通 |
| 条件筛选（where） | ⭐⭐⭐⭐⭐ | 精通 |
| 分页查询（skip/take） | ⭐⭐⭐⭐ | 熟练 |
| 更新操作（update/updateMany） | ⭐⭐⭐⭐⭐ | 精通 |
| 删除操作（delete/deleteMany） | ⭐⭐⭐⭐ | 熟练 |
| 聚合查询（aggregate/groupBy） | ⭐⭐⭐⭐ | 熟练 |

### 下一步

完成本章后，你应该能够：
- ✅ 独立完成任何单表的 crud 操作
- ✅ 使用条件筛选和分页查询
- ✅ 进行数据统计和聚合

准备好进入**阶段三：关联查询（一对多）**！

---

## 🔗 参考资源

- [Prisma crud 文档](https://prisma.io/docs/concepts/components/prisma-client/crud)
- [Prisma 查询指南](https://prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [示例代码 - 用户认证](../../examples/postgres-prisma/auth-system.ts)
