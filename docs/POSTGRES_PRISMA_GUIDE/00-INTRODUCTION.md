# PostgreSQL + Prisma 循序渐进学习指南 🐘🦊

> 通过 6 个阶段、12 个实战案例，从入门到精通 PostgreSQL 数据库开发  
> **预计学习时间**: 15-20 小时 | **代码示例**: 4 个完整项目 | **练习题**: 30+ 道

---

## 📚 学习路线总览

| 阶段 | 主题 | 时长 | 案例数 | 难度 |
|------|------|------|--------|------|
| 阶段一 | 环境准备与基础概念 | 2 小时 | 2 个 | ⭐⭐ |
| 阶段二 | CRUD 基础操作 | 3 小时 | 3 个 | ⭐⭐⭐ |
| 阶段三 | 关联查询（一对多） | 3 小时 | 2 个 | ⭐⭐⭐⭐ |
| 阶段四 | 高级关联（多对多） | 3 小时 | 2 个 | ⭐⭐⭐⭐ |
| 阶段五 | 事务与锁机制 | 3 小时 | 2 个 | ⭐⭐⭐⭐⭐ |
| 阶段六 | 实战项目综合 | 4 小时 | 1 个 | ⭐⭐⭐⭐⭐ |

---

## 🎯 学习目标

完成本教程后，你将能够：

- ✅ 独立搭建 PostgreSQL + Prisma 开发环境
- ✅ 设计合理的数据库模型和关系
- ✅ 熟练进行 CRUD 操作和复杂查询
- ✅ 处理一对多、多对多等关联关系
- ✅ 使用事务保证数据一致性
- ✅ 实现乐观锁/悲观锁防止并发问题
- ✅ 完成真实业务场景的数据库开发

---

## 📁 配套资源

| 资源类型 | 位置 | 说明 |
|----------|------|------|
| **示例代码** | `examples/postgres-prisma/` | 4 个完整项目 |
| **Schema 文件** | `prisma/schema-postgres.prisma` | 完整数据模型 |
| **实践练习** | 本教程各章节 | 30+ 道练习题 |
| **参考答案** | 示例代码中 | 可直接运行 |

---

## 🚀 快速开始

### 环境准备

```bash
# 1. 安装依赖
bun install prisma @prisma/client --dev
bun install bcryptjs @types/bcryptjs jose @types/node

# 2. 配置数据库
cp prisma/schema-postgres.prisma prisma/schema.prisma

# 3. 设置环境变量（.env 文件）
DATABASE_URL="postgresql://user:password@localhost:5432/bun_elysia_learn?schema=public"

# 4. 初始化数据库
bun x prisma generate
bun x prisma migrate dev --name init
bun x prisma studio  # 可视化查看数据
```

---
