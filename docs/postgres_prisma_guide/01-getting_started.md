# 阶段一：环境准备与基础概念

> 学习时间：2 小时 | 难度：⭐⭐

---

## 1.1 postgresql 简介

### 什么是 postgresql？

postgresql 是一个强大的开源关系型数据库管理系统，以其稳定性、可靠性和强大的功能著称。

**核心特点：**
- 🟢 完全开源免费
- 🟢 支持复杂查询和事务
- 🟢 强大的数据类型支持
- 🟢 优秀的并发控制
- 🟢 丰富的扩展生态

### postgresql vs MySQL

| 特性 | postgresql | MySQL |
|------|------------|-------|
| 事务支持 | 完整 ACID | 完整 ACID |
| JSON 支持 | 优秀 | 一般 |
| 复杂查询 | 强大 | 一般 |
| 并发性能 | 优秀 | 良好 |
| 学习曲线 | 稍陡 | 平缓 |
| 适用场景 | 复杂业务 | 简单 Web |

---

## 1.2 Prisma orm 简介

### 什么是 Prisma？

Prisma 是一个新一代的 orm（对象关系映射）工具，让数据库操作变得简单优雅。

**核心优势：**
- 🟢 类型安全（typescript 优先）
- 🟢 直观的数据模型定义
- 🟢 自动生成的查询 api
- 🟢 内置数据库迁移
- 🟢 优秀的开发体验

### Prisma 核心组件

```
Prisma schema (数据模型定义)
    ↓
Prisma Migrate (数据库迁移)
    ↓
Prisma client (类型安全的查询 api)
    ↓
Prisma Studio (可视化数据管理)
```

---

## 1.3 安装与配置

### 步骤 1：安装 postgresql

**macOS:**
```bash
# 使用 Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
```
下载安装包：https://www.postgresql.org/download/windows/
按照向导安装
```

### 步骤 2：创建数据库

```bash
# 进入 postgresql
psql -U postgres

# 创建数据库
CREATE DATABASE bun_elysia_learn;

# 创建用户（可选）
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE bun_elysia_learn TO myuser;

# 退出
\q
```

### 步骤 3：配置 Prisma

```bash
# 在项目根目录初始化 Prisma
bun x prisma init

# 生成的目录结构：
prisma/
  └── schema.prisma    # 数据模型定义
.env                   # 数据库连接字符串
```

### 步骤 4：配置数据库连接

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bun_elysia_learn?schema=public"
```

**连接字符串格式：**
```
postgresql://用户名:密码@主机：端口/数据库名？schema=public
```

---

## 1.4 Prisma schema 基础

### schema 文件结构

```prisma
// 1. 数据源配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 2. 生成器配置
generator client {
  provider = "prisma-client-js"
}

// 3. 数据模型定义
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### 字段属性详解

| 属性 | 说明 | 示例 |
|------|------|------|
| `@id` | 主键 | `@id` |
| `@default()` | 默认值 | `@default(autoincrement())` |
| `@unique` | 唯一约束 | `@unique` |
| `@default(now())` | 默认当前时间 | `@default(now())` |
| `?` | 可为空 | `name String?` |
| `@db.VarChar(255)` | 指定数据库类型 | `@db.VarChar(255)` |
| `@db.Decimal(10,2)` | 小数精度 | `@db.Decimal(10,2)` |

### 常用数据类型

```prisma
model DataTypeExample {
  id          Int      @id @default(autoincrement())
  
  // 字符串类型
  title       String
  description String?  // 可为空
  content     String   @db.Text  // 长文本
  
  // 数字类型
  age         Int
  price       Decimal  @db.Decimal(10, 2)
  rating      Float
  
  // 布尔类型
  isActive    Boolean  @default(true)
  
  // 日期时间
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  
  // 数组类型
  tags        String[]
  scores      Int[]
  
  // JSON 类型
  metadata    Json?
}
```

---

## 1.5 数据库迁移

### 创建迁移

```bash
# 创建迁移（会生成 sql 并执行）
bun x prisma migrate dev --name init_users_table

# 查看迁移历史
bun x prisma migrate status

# 重置数据库（⚠️ 会清空数据）
bun x prisma migrate reset
```

### 迁移文件结构

```
prisma/
  migrations/
    20240101000000_init_users_table/
      ├── migration.sql          # 生成的 sql
      └── migration_lock.toml    # 锁定文件
```

### 生成的 sql 示例

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL not NULL,
    "email" TEXT not NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) not NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

---

## 1.6 Prisma Studio 可视化

### 启动 Studio

```bash
bun x prisma studio
```

浏览器打开：http://localhost:5555

### Studio 功能

- 🟢 可视化查看数据
- 🟢 直接编辑记录
- 🟢 创建/删除关联数据
- 🟢 查看表结构
- 🟢 执行原始 sql

---

## 📝 练习 1.1：创建第一个模型

**任务：** 创建一个简单的博客用户模型

**要求：**
1. 包含字段：id, email, name, role, createdAt
2. email 字段唯一
3. role 字段为枚举类型（USER, ADMIN）
4. 添加适当的索引

**参考答案：**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  
  @@index([email])
}

enum Role {
  USER
  ADMIN
}
```

**执行步骤：**
```bash
# 1. 编辑 schema.prisma
# 2. 创建迁移
bun x prisma migrate dev --name add_user_model
# 3. 打开 Studio 查看
bun x prisma studio
```

---

## 📝 练习 1.2：设计电商数据模型

**任务：** 设计简单的电商数据模型

**要求：**
1. Product 表：id, name, price, stock, isActive
2. 价格使用 Decimal 类型，精度 10,2
3. 添加创建时间和更新时间

**参考答案：**

```prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Decimal  @db.Decimal(10, 2)
  stock     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([isActive])
}
```

---

## 📚 阶段一总结

### 知识点回顾

| 知识点 | 重要程度 | 掌握要求 |
|--------|----------|----------|
| postgresql 安装配置 | ⭐⭐⭐ | 熟练 |
| Prisma schema 语法 | ⭐⭐⭐⭐⭐ | 精通 |
| 数据类型选择 | ⭐⭐⭐⭐ | 熟练 |
| 数据库迁移 | ⭐⭐⭐⭐⭐ | 精通 |
| Prisma Studio 使用 | ⭐⭐⭐ | 熟悉 |

### 下一步

完成本章后，你应该能够：
- ✅ 独立安装和配置 postgresql
- ✅ 编写 Prisma schema 定义数据模型
- ✅ 创建和执行数据库迁移
- ✅ 使用 Prisma Studio 查看数据

准备好进入**阶段二：crud 基础操作**！

---

## 🔗 参考资源

- [postgresql 官方文档](https://postgresql.org/docs)
- [Prisma schema 参考](https://prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma 数据模型](https://prisma.io/docs/concepts/components/prisma-schema/data-model)
