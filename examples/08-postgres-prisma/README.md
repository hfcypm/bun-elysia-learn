# postgresql + Prisma 经典示例指南 🐘🦊

本目录包含 4 个经典的 postgresql + Prisma 组合示例，覆盖真实业务场景。

---

## 📁 示例列表

| 示例 | 文件 | 说明 | 难度 |
|------|------|------|------|
| 用户认证系统 | `auth-system.ts` | 注册/登录/jwt/密码重置 | ⭐⭐⭐ |
| 博客系统 | `blog-system.ts` | 文章/分类/标签/评论/分页 | ⭐⭐⭐⭐ |
| 电商订单 | `ecommerce-order.ts` | 商品/购物车/订单/事务处理 | ⭐⭐⭐⭐⭐ |
| 学生课程 | `student-course.ts` | 选课/成绩/GPA 计算 | ⭐⭐⭐⭐ |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Prisma
bun install prisma @prisma/client --dev
bun install bcryptjs @types/bcryptjs jose @types/node
```

### 2. 配置数据库

```bash
# 复制 schema 到 prisma 目录
cp prisma/schema-postgres.prisma prisma/schema.prisma

# 配置数据库连接（修改 .env 文件）
DATABASE_URL="postgresql://user:password@localhost:5432/bun_elysia_learn?schema=public"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
bun x prisma generate

# 创建数据库迁移
bun x prisma migrate dev --name init_postgres_examples

# 查看数据库
bun x prisma studio
```

### 4. 运行示例

```bash
# 用户认证系统
bun run examples/postgres-prisma/auth-system.ts

# 博客系统
bun run examples/postgres-prisma/blog-system.ts

# 电商订单系统
bun run examples/postgres-prisma/ecommerce-order.ts

# 学生课程系统
bun run examples/postgres-prisma/student-course.ts
```

---

## 📖 各示例详解

### 1️⃣ 用户认证系统 (auth-system.ts)

**核心功能：**

```
✅ 用户注册（密码加密）
✅ 用户登录（密码验证 + jwt）
✅ 用户信息更新
✅ 密码修改
✅ 管理员密码重置
```

**关键代码：**

```typescript
// 密码加密
const hashedPassword = await bcrypt.hash(password, 12);

// jwt Token 生成
const token = await new SignJWT({ userId: user.id })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('7d')
  .sign(secret);

// 密码验证
const isValid = await bcrypt.compare(password, hashedPassword);
```

**涉及模型：**
- User（用户）

---

### 2️⃣ 博客系统 (blog-system.ts)

**核心功能：**

```
✅ 文章 crud
✅ 分类管理（树形结构）
✅ 标签管理（多对多）
✅ 评论系统（嵌套回复）
✅ 分页查询
✅ 全文搜索
✅ 点赞功能
✅ 文章统计
```

**关键代码：**

```typescript
// 分类树查询
await prisma.category.findMany({
  where: { parentId: null },
  include: {
    children: { include: { children: true } },
    _count: { select: { posts: true } }
  }
});

// 多对多标签关联
await prisma.post.create({
  data: {
    tags: {
      connectOrCreate: tagNames.map(name => ({
        where: { name },
        create: { name }
      }))
    }
  }
});

// 分页查询
await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

**涉及模型：**
- User（作者）
- Post（文章）
- Category（分类，自关联）
- Tag（标签）
- PostTag（多对多关联表）
- Comment（评论，自关联）
- Like（点赞）

---

### 3️⃣ 电商订单系统 (ecommerce-order.ts)

**核心功能：**

```
✅ 商品管理（多 SKU）
✅ 购物车管理
✅ 订单创建（事务处理）
✅ 订单状态流转
✅ 库存扣减（乐观锁）
✅ 销售统计
✅ 订单取消（库存回滚）
```

**关键代码：**

```typescript
// 事务处理订单
await prisma.$transaction(async (tx) => {
  // 1. 获取购物车
  // 2. 验证库存
  // 3. 创建订单
  // 4. 扣减库存（乐观锁）
  // 5. 清空购物车
});

// 乐观锁库存扣减
await tx.product.update({
  where: {
    id: productId,
    stock: { gte: quantity } // 条件检查
  },
  data: {
    stock: { decrement: quantity }
  }
});

// 库存回滚
await tx.product.update({
  where: { id: productId },
  data: {
    stock: { increment: quantity }
  }
});
```

**涉及模型：**
- Product（商品）
- ProductSKU（商品规格）
- CartItem（购物车）
- Order（订单）
- OrderItem（订单项）
- Category（分类）
- User（用户）

---

### 4️⃣ 学生课程系统 (student-course.ts)

**核心功能：**

```
✅ 学生管理
✅ 课程管理
✅ 选课系统（多对多）
✅ 成绩录入（平时 + 期末）
✅ GPA 计算
✅ 学分统计
✅ 课程表查询
✅ 成绩分析
```

**关键代码：**

```typescript
// GPA 计算
function calculateGPA(grades) {
  const gradeToPoint = (score) => {
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    // ...
  };
  // 加权平均
  return totalPoints / totalCredits;
}

// 多对多选课
await prisma.enrollment.create({
  data: {
    studentId,
    courseId
  }
});

// 成绩分析
await prisma.enrollment.aggregate({
  where: { courseId },
  _avg: { totalScore: true },
  _count: true
});
```

**涉及模型：**
- Student（学生）
- Teacher（教师）
- Course（课程）
- Enrollment（选课记录，多对多关联）

---

## 🔑 核心概念解析

### 一对多关系

```prisma
model User {
  posts Post[]
}

model Post {
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### 多对多关系

```prisma
model Post {
  tags PostTag[]
}

model Tag {
  posts PostTag[]
}

model PostTag {
  postId Int @ref(Post)
  tagId  Int @ref(Tag)
  @@id([postId, tagId])
}
```

### 自关联（树形结构）

```prisma
model Category {
  parentId Int?
  parent   Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
}
```

### 事务处理

```typescript
await prisma.$transaction(async (tx) => {
  // 所有操作原子性执行
  const order = await tx.order.create({...});
  await tx.product.update({...});
  // 任一失败全部回滚
});
```

### 乐观锁

```typescript
await tx.product.update({
  where: {
    id: productId,
    stock: { gte: quantity } // 条件
  }
});
```

### 聚合查询

```typescript
await prisma.order.aggregate({
  _count: true,
  _sum: { totalAmount: true },
  _avg: { totalAmount: true }
});
```

---

## 💡 最佳实践

### 1. 错误处理

```typescript
try {
  // 数据库操作
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // 处理特定错误码
    console.log(error.code);
  }
  throw error;
}
```

### 2. 查询优化

```typescript
// ✅ 只查询需要的字段
await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }
});

// ✅ 使用 include 预加载关联
await prisma.post.findMany({
  include: { author: true, tags: true }
});

// ✅ 使用索引
@@index([email])
@@index([createdAt])
```

### 3. 批量操作

```typescript
// 批量创建
await prisma.user.createMany({
  data: [
    { email: 'a@b.com', password: 'xxx' },
    { email: 'c@d.com', password: 'xxx' }
  ]
});

// 批量更新
await prisma.user.updateMany({
  where: { role: 'USER' },
  data: { isActive: true }
});
```

---

## 🎯 学习建议

1. **先运行示例**：直接运行代码看效果
2. **查看数据库**：使用 Prisma Studio 可视化查看数据
3. **修改数据**：尝试修改示例中的数据，观察结果
4. **理解关联**：重点理解一对多、多对多关系
5. **掌握事务**：理解事务的原子性和回滚机制

---

## 🔗 相关资源

- [Prisma 官方文档](https://prisma.io/docs)
- [Prisma schema 参考](https://prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma client api](https://prisma.io/docs/reference/api-reference/prisma-client-reference)
- [postgresql 文档](https://postgresql.org/docs)

---

**Happy Coding! 🚀**
