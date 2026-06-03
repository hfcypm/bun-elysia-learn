# PostgreSQL + Prisma 循序渐进学习指南

> 🐘 从入门到精通的完整学习路径  
> 6 个阶段 | 12 个实战案例 | 30+ 道练习 | 预计 15-20 小时

---

## 📚 完整学习路线

```
阶段一：环境准备与基础概念 (2 小时)
         ↓
阶段二：CRUD 基础操作 (3 小时)
         ↓
阶段三：关联查询 - 一对多 (3 小时)
         ↓
阶段四：高级关联 - 多对多 (3 小时)
         ↓
阶段五：事务与锁机制 (3 小时)
         ↓
阶段六：实战项目综合 (4 小时)
         ↓
完成！🎉
```

---

## 📖 课程目录

### 阶段一：环境准备与基础概念 ⭐⭐

**学习内容：**
- PostgreSQL 简介与安装
- Prisma ORM 基础
- Schema 定义语法
- 数据库迁移
- Prisma Studio 使用

**[开始学习 →](./01-GETTING_STARTED.md)**

---

### 阶段二：CRUD 基础操作 ⭐⭐⭐

**学习内容：**
- 创建操作（create/createMany）
- 查询操作（findUnique/findFirst/findMany）
- 条件筛选（where）
- 分页查询（skip/take）
- 更新操作（update/updateMany）
- 删除操作（delete/deleteMany）
- 聚合查询（aggregate/groupBy）

**[开始学习 →](./02-CRUD-BASICS.md)**

---

### 阶段三：关联查询（一对多） ⭐⭐⭐⭐

**学习内容：**
- 一对多关系定义
- 创建关联数据（connect/create）
- include 包含关联
- 嵌套过滤与分页
- 反向关联查询
- 统计关联数量（_count）

**[开始学习 →](./03-RELATIONSHIP-ONE-TO-MANY.md)**

**实战案例：**
- [博客系统](../../examples/postgres-prisma/blog-system.ts) - 文章/分类/评论
- [学生课程](../../examples/postgres-prisma/student-course.ts) - 选课/成绩管理

---

### 阶段四：高级关联（多对多） ⭐⭐⭐⭐

**学习内容：**
- 隐式多对多 vs 显式多对多
- connectOrCreate 操作
- 中间表管理
- 嵌套创建/更新
- set/connect/disconnect

**[开始学习 →](./04-RELATIONSHIP-MANY-TO-MANY.md)**

**实战案例：**
- [博客标签](../../examples/postgres-prisma/blog-system.ts) - 文章标签管理
- [学生角色](../../examples/postgres-prisma/student-course.ts) - 多角色授权

---

### 阶段五：事务与锁机制 ⭐⭐⭐⭐⭐

**学习内容：**
- ACID 事务特性
- $transaction 数组/回调方式
- 乐观锁实现
- 悲观锁使用
- 错误处理与重试
- 回滚与撤销

**[开始学习 →](./05-TRANSACTIONS-AND-LOCKS.md)**

**实战案例：**
- [电商订单](../../examples/postgres-prisma/ecommerce-order.ts) - 事务处理/库存扣减
- [银行转账](../../examples/postgres-prisma/ecommerce-order.ts) - 原子操作/余额检查

---

### 阶段六：实战项目综合 ⭐⭐⭐⭐⭐

**学习内容：**
- 在线学习平台开发
- 完整 Schema 设计
- 核心功能实现
- 性能优化建议
- 测试与部署

**[开始学习 →](./06-FINAL-PROJECT.md)**

**项目包括：**
- 用户认证系统
- 课程管理模块
- 选课系统
- 作业提交与批改
- 成绩管理
- 评论问答

---

## 📁 配套资源

### 示例代码

| 示例 | 文件路径 | 知识点 |
|------|----------|--------|
| 用户认证 | `examples/postgres-prisma/auth-system.ts` | 注册/登录/JWT |
| 博客系统 | `examples/postgres-prisma/blog-system.ts` | 一对多/多对多/分页 |
| 电商订单 | `examples/postgres-prisma/ecommerce-order.ts` | 事务/锁/复杂关联 |
| 学生课程 | `examples/postgres-prisma/student-course.ts` | 多对多/统计/GPA |

### Schema 文件

| 文件 | 说明 |
|------|------|
| `prisma/schema-postgres.prisma` | 完整数据模型定义 |

### 练习题

每个章节都配有 2-3 道练习题，总计 30+ 道

---

## 🎯 学习目标

完成本教程后，你将能够：

### 基础能力
- ✅ 独立安装和配置 PostgreSQL 数据库
- ✅ 编写 Prisma Schema 定义数据模型
- ✅ 创建和执行数据库迁移
- ✅ 使用 Prisma Studio 管理数据

### 核心技能
- ✅ 熟练进行 CRUD 操作
- ✅ 设计一对多、多对多关系
- ✅ 编写复杂查询和关联查询
- ✅ 进行数据统计和聚合

### 高级技能
- ✅ 使用事务保证数据一致性
- ✅ 实现乐观锁/悲观锁防止并发问题
- ✅ 设计完整的数据库架构
- ✅ 开发生产级业务系统

---

## 💡 学习建议

### 1. 按顺序学习

本教程采用**循序渐进**的方式组织内容，建议按顺序学习：

```
基础概念 → CRUD → 一对多 → 多对多 → 事务 → 实战
```

### 2. 动手实践

每个章节都有配套的**示例代码**和**练习题**：

```
阅读理论 → 运行示例 → 完成练习 → 总结复习
```

### 3. 参考资料

遇到问题时，随时查阅：

- 官方文档
- 示例代码
- 练习题答案

### 4. 学习节奏

建议学习节奏：

| 方式 | 时长 | 建议 |
|------|------|------|
| 快速学习 | 3-5 天 | 每天一个阶段 |
| 正常学习 | 1-2 周 | 每 2-3 天一个阶段 |
| 深度学习 | 2-4 周 | 每周一个阶段，完成所有练习 |

---

## 📊 知识点地图

```
PostgreSQL + Prisma
├── 基础概念
│   ├── Schema 定义 ⭐⭐⭐⭐⭐
│   ├── 数据类型 ⭐⭐⭐⭐
│   └── 数据库迁移 ⭐⭐⭐⭐⭐
│
├── CRUD 操作
│   ├── 创建 (create/createMany) ⭐⭐⭐⭐⭐
│   ├── 查询 (findUnique/findMany) ⭐⭐⭐⭐⭐
│   ├── 条件筛选 (where) ⭐⭐⭐⭐⭐
│   ├── 分页 (skip/take) ⭐⭐⭐⭐
│   ├── 更新 (update/updateMany) ⭐⭐⭐⭐⭐
│   └── 删除 (delete/deleteMany) ⭐⭐⭐⭐
│
├── 关联关系
│   ├── 一对多 ⭐⭐⭐⭐⭐
│   ├── 多对多 ⭐⭐⭐⭐⭐
│   └── 嵌套查询 ⭐⭐⭐⭐
│
├── 高级特性
│   ├── 事务处理 ⭐⭐⭐⭐⭐
│   ├── 乐观锁 ⭐⭐⭐⭐⭐
│   └── 悲观锁 ⭐⭐⭐⭐
│
└── 实战应用
    ├── 数据建模 ⭐⭐⭐⭐⭐
    ├── 性能优化 ⭐⭐⭐⭐
    └── 生产实践 ⭐⭐⭐⭐
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
bun install prisma @prisma/client --dev
bun install bcryptjs @types/bcryptjs jose @types/node

# 配置数据库
cp prisma/schema-postgres.prisma prisma/schema.prisma

# 设置 .env 文件
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/bun_elysia_learn?schema=public"' >> .env

# 初始化
bun x prisma generate
bun x prisma migrate dev
```

### 2. 运行示例

```bash
# 用户认证
bun run examples/postgres-prisma/auth-system.ts

# 博客系统
bun run examples/postgres-prisma/blog-system.ts

# 电商订单
bun run examples/postgres-prisma/ecommerce-order.ts

# 学生课程
bun run examples/postgres-prisma/student-course.ts
```

### 3. 打开可视化

```bash
bun x prisma studio
```

---

## 📈 学习进度追踪

建议使用以下方法追踪学习进度：

```markdown
## 我的学习进度

- [x] 阶段一：环境准备与基础概念
- [ ] 阶段二：CRUD 基础操作
- [ ] 阶段三：关联查询（一对多）
- [ ] 阶段四：高级关联（多对多）
- [ ] 阶段五：事务与锁机制
- [ ] 阶段六：实战项目综合
```

---

## ❓ 常见问题

### Q1: 必须使用 PostgreSQL 吗？

**A:** 不是必须，但建议使用 PostgreSQL。Prisma 也支持 MySQL、SQL Server、SQLite、MongoDB 等数据库。

### Q2: 需要 TypeScript 基础吗？

**A:** 建议有基本的 TypeScript 知识，但即使只用 JavaScript 也可以学习。

### Q3: 学完后能做什么？

**A:** 学完后你将能够：
- 独立开发后端 API 的数据库部分
- 设计合理的数据库模型
- 处理复杂的业务逻辑
- 为全栈开发打下基础

### Q4: 遇到问题怎么办？

**A:** 
1. 查看官方文档
2. 参考示例代码
3. 在 GitHub Issues 提问
4. 在社区论坛求助

---

## 🔗 参考资源

### 官方文档

- [Prisma 官方文档](https://prisma.io/docs)
- [PostgreSQL 官方文档](https://postgresql.org/docs)
- [Prisma Schema 参考](https://prisma.io/docs/reference/api-reference/prisma-schema-reference)

### 示例代码

- [用户认证示例](../../examples/postgres-prisma/auth-system.ts)
- [博客系统示例](../../examples/postgres-prisma/blog-system.ts)
- [电商订单示例](../../examples/postgres-prisma/ecommerce-order.ts)
- [学生课程示例](../../examples/postgres-prisma/student-course.ts)

### 社区资源

- [Prisma GitHub](https://github.com/prisma/prisma)
- [PostgreSQL 中文社区](https://postgres.cn)
- [Prisma Discord](https://discord.gg/prisma)

---

## 🎓 证书与认可

完成本教程后，你将获得：

- ✅ 完整的 PostgreSQL + Prisma 知识体系
- ✅ 4 个完整的项目实战经验
- ✅ 30+ 道练习题的实战训练
- ✅ 继续学习高级特性的基础

---

## 📝 更新日志

| 日期 | 内容 | 版本 |
|------|------|------|
| 2026-06-03 | 初始版本完成 | v1.0 |

---

**祝学习愉快！🎉**

---

*最后更新：2026-06-03*
