# Prisma 学习路径指南

> 循序渐进掌握 Prisma ORM 的完整学习路线

---

## 📖 学习路线总览

```
入门篇 (1-2 天)
  ├─ 了解 Prisma 是什么
  ├─ 安装与配置
  └─ 第一个 Prisma 项目

基础篇 (2-3 天)
  ├─ 数据模型定义
  ├─ 数据库迁移
  └─ CRUD 基础操作

进阶篇 (3-5 天)
  ├─ 关联关系与查询
  ├─ 事务处理
  ├─ 聚合查询
  └─ 批量操作

实战篇 (5-7 天)
  ├─ 博客系统
  ├─ 电商系统
  └─ 书签管理系统
```

---

## 📚 学习资源

### 官方文档
- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

### 本教程资源
| 文件 | 内容 | 难度 |
|------|------|------|
| `docs/PRISMA_TUTORIAL.md` | 完整教程文档 | ⭐⭐⭐ |
| `examples/prisma-basic-user.ts` | 用户管理案例 | ⭐ |
| `examples/prisma-blog.ts` | 博客系统案例 | ⭐⭐ |
| `examples/prisma-ecommerce.ts` | 电商系统案例 | ⭐⭐⭐ |
| `src/advanced/bookmark-system.ts` | 书签系统综合案例 | ⭐⭐⭐⭐ |

---

## 🎯 详细学习步骤

### 第 1 天：入门与安装

#### 学习内容
1. 了解 Prisma 是什么
2. 安装 Prisma
3. 创建第一个项目

#### 实践任务
```bash
# 1. 初始化项目
mkdir prisma-learning && cd prisma-learning
npm init -y
npm install prisma @prisma/client

# 2. 初始化 Prisma
npx prisma init

# 3. 配置 SQLite
# 编辑 .env 文件，设置 DATABASE_URL="file:./dev.db"
```

#### 参考文档
- `docs/PRISMA_TUTORIAL.md` - 第 01-02 章

---

### 第 2 天：数据模型与迁移

#### 学习内容
1. 定义数据模型
2. 字段类型和属性
3. 数据库迁移

#### 实践任务
```prisma
// 编辑 prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生成 Client
npx prisma generate

# 打开可视化界面
npx prisma studio
```

#### 参考文档
- `docs/PRISMA_TUTORIAL.md` - 第 03-04 章
- `prisma/schema-basic.prisma`

---

### 第 3 天：CRUD 基础操作

#### 学习内容
1. 创建数据
2. 查询数据
3. 更新数据
4. 删除数据

#### 实践任务
```typescript
// 创建 examples/test-user.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 创建
  const user = await prisma.user.create({
    data: { email: 'test@example.com', name: 'Test' }
  })
  
  // 查询
  const users = await prisma.user.findMany()
  
  // 更新
  await prisma.user.update({
    where: { id: user.id },
    data: { name: 'Updated' }
  })
  
  // 删除
  await prisma.user.delete({ where: { id: user.id } })
}

main()
```

```bash
# 运行测试
npx ts-node examples/test-user.ts
```

#### 参考文档
- `docs/PRISMA_TUTORIAL.md` - 第 05-08 章
- `examples/prisma-basic-user.ts`

---

### 第 4 天：关联关系

#### 学习内容
1. 一对一关系
2. 一对多关系
3. 多对多关系
4. 关联查询

#### 实践任务
```prisma
// 博客系统模型
model Author {
  id     Int     @id
  email  String  @unique
  posts  Post[]
}

model Post {
  id       Int      @id
  title    String
  authorId Int
  author   Author   @relation(fields: [authorId], references: [id])
  tags     PostTag[]
}

model Tag {
  id     Int       @id
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

#### 参考文档
- `docs/PRISMA_TUTORIAL.md` - 第 09 章
- `prisma/schema-blog.prisma`
- `examples/prisma-blog.ts`

---

### 第 5 天：事务与聚合

#### 学习内容
1. 事务处理
2. 聚合查询
3. 批量操作

#### 实践任务
```typescript
// 事务示例
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({...})
  const post = await tx.post.create({ authorId: user.id })
  return { user, post }
})

// 聚合查询
const stats = await prisma.post.aggregate({
  _count: true,
  _avg: { viewCount: true }
})

// 批量创建
await prisma.user.createMany({
  data: [...users],
  skipDuplicates: true
})
```

#### 参考文档
- `docs/PRISMA_TUTORIAL.md` - 第 10-12 章
- `examples/prisma-ecommerce.ts`

---

### 第 6-7 天：实战项目

#### 选择一：博客系统
完整实现一个博客系统，包括：
- 用户管理
- 文章 CRUD
- 评论系统
- 标签管理

**参考代码**: `examples/prisma-blog.ts`

#### 选择二：电商系统
完整实现一个简易电商系统，包括：
- 商品管理
- 订单处理
- 库存管理
- 销售统计

**参考代码**: `examples/prisma-ecommerce.ts`

#### 选择三：书签管理系统（综合）
完整的企业级书签管理系统

**运行步骤**:
```bash
# 1. 配置数据库
cp prisma/schema-bookmark.prisma prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate

# 2. 运行系统
bun run src/advanced/bookmark-system.ts

# 3. 初始化数据
curl -X POST http://localhost:3021/api/db/seed
```

**参考文档**: `docs/BOOKMARK_SYSTEM_GUIDE.md`

---

## 🔧 常用命令速查

### 开发命令
```bash
npx prisma migrate dev              # 创建并应用迁移
npx prisma generate                 # 生成 Prisma Client
npx prisma studio                   # 可视化界面
```

### 生产部署
```bash
npx prisma migrate deploy           # 应用迁移
npx prisma generate                 # 生成 Client
```

### 调试命令
```bash
npx prisma db seed                  # 播种数据
npx prisma db pull                  # 从数据库导入 schema
npx prisma db push                  # 推送 schema
npx prisma migrate reset            # 重置数据库
```

---

## 🎓 实践项目清单

### 入门级 ⭐
- [ ] 用户管理系统
- [ ] 简单的待办事项

### 进阶级 ⭐⭐
- [ ] 博客系统
- [ ] 图书管理系统
- [ ] 学生信息管理系统

### 高级 ⭐⭐⭐
- [ ] 电商系统
- [ ] 社交网络平台
- [ ] 书签管理系统

---

## 💡 学习技巧

### 1. 多使用 Prisma Studio
```bash
npx prisma studio
```
可视化查看和编辑数据，直观理解数据关系。

### 2. 查看生成的 SQL
```bash
# 开发模式会显示执行的 SQL
DATABASE_URL="file:./dev.db" npx prisma migrate dev
```

### 3. 使用 TypeScript 获得类型提示
```typescript
// 充分利用 TypeScript 的智能提示
const user = await prisma.user.findFirst({
  where: { 
    // TypeScript 会提示可用字段
    email: { contains: '@' }
  }
})
```

### 4. 善用文档搜索
遇到问题先查官方文档，大部分问题都有解答。

### 5. 從小到大逐步构建
先实现简单的 CRUD，再添加复杂功能。

---

## 📝 学习检查清单

### 入门篇
- [ ] 能够安装 Prisma
- [ ] 能够创建简单的数据模型
- [ ] 能够执行数据库迁移
- [ ] 能够使用 Prisma Studio

### 基础篇
- [ ] 理解各种字段类型
- [ ] 掌握 CRUD 操作
- [ ] 能够进行条件查询
- [ ] 能够实现分页和排序

### 进阶篇
- [ ] 理解并实现一对一关系
- [ ] 理解并实现一对多关系
- [ ] 理解并实现多对多关系
- [ ] 能够使用事务
- [ ] 能够使用聚合查询

### 实战篇
- [ ] 独立完成博客系统
- [ ] 独立完成电商系统
- [ ] 理解级联操作
- [ ] 能够优化查询性能

---

## 🚀 下一步学习

完成本教程后，可以学习：

1. **性能优化**
   - 数据库索引优化
   - 查询优化
   - 连接池配置

2. **生产部署**
   - 多环境配置
   - 迁移管理
   - 监控和日志

3. **高级功能**
   - Prisma Middleware
   - 自定义查询
   - 数据库函数和触发器

4. **扩展生态**
   - 结合 Next.js
   - 结合 NestJS
   - 结合 GraphQL

---

**祝你学习愉快！** 🎉

如有问题，欢迎查阅 `docs/PRISMA_TUTORIAL.md` 或官方文档。
