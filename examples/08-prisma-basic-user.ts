/**
 * Prisma 示例：Prisma 用户管理
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 使用 Prisma ORM
 * 2. ✅ 定义数据模型
 * 3. ✅ Prisma 基础 CRUD
 * 4. ✅ SQLite 数据库操作
 * 
 * ⚠️ 注意事项：
 * - 先复制 schema 文件
 * - 运行 bun x prisma generate
 * - 执行数据库迁移
 * 
 * 📝 练习任务：
 * - Prisma 基础 CRUD
 * - 用户模型操作
 * - SQLite 数据库
 * 
 * 🔗 相关文档：
 * - docs/14-PRISMA_TUTORIAL.md - Prisma 完整教程
 * - docs/15-PRISMA_LEARNING_PATH.md - 学习路径
 * - docs/16-PRISMA_GUIDE.md - 使用指南
 * 
 * 运行：bun run examples/08-prisma-basic-user.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📚 Prisma 基础入门 - 用户管理\n')

  // ==================== 1. 创建用户 ====================
  console.log('=== 1. 创建用户 ===')

  // 创建单个用户
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      age: 25
    }
  })
  console.log('创建用户 1:', user1)

  // 创建另一个用户
  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      age: 30
    }
  })
  console.log('创建用户 2:', user2)

  // 批量创建
  const batchResult = await prisma.user.createMany({
    data: [
      { email: 'user1@example.com', name: 'User One', age: 20 },
      { email: 'user2@example.com', name: 'User Two', age: 35 },
      { email: 'user3@example.com', name: 'User Three', age: 28 }
    ],
    skipDuplicates: true
  })
  console.log(`批量创建了 ${batchResult.count} 个用户\n`)

  // ==================== 2. 查询用户 ====================
  console.log('=== 2. 查询用户 ===')

  // 查询所有用户
  const allUsers = await prisma.user.findMany()
  console.log('所有用户:', allUsers)

  // 查询单个用户（按 ID）
  const userById = await prisma.user.findUnique({
    where: { id: 1 }
  })
  console.log('按 ID 查询:', userById)

  // 查询单个用户（按邮箱）
  const userByEmail = await prisma.user.findFirst({
    where: { email: 'john@example.com' }
  })
  console.log('按邮箱查询:', userByEmail)

  // 条件查询
  const usersOver25 = await prisma.user.findMany({
    where: {
      age: {
        gte: 25
      }
    }
  })
  console.log('25 岁以上的用户:', usersOver25)

  // 选择字段
  const usersWithEmail = await prisma.user.findMany({
    select: {
      id: true,
      email: true
    }
  })
  console.log('只查询 ID 和邮箱:', usersWithEmail)

  // 模糊搜索
  const usersWithName = await prisma.user.findMany({
    where: {
      name: {
        contains: 'User'
      }
    }
  })
  console.log('名字包含 User 的用户:', usersWithName)

  // 总数统计
  const totalUsers = await prisma.user.count()
  console.log('用户总数:', totalUsers)

  // 分页查询
  const page = 1
  const limit = 2
  const paginatedUsers = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit
  })
  console.log(`第${page}页，每页${limit}条:`, paginatedUsers)

  // 排序查询
  const sortedUsers = await prisma.user.findMany({
    orderBy: {
      age: 'desc'
    }
  })
  console.log('按年龄降序:', sortedUsers, '\n')

  // ==================== 3. 更新用户 ====================
  console.log('=== 3. 更新用户 ===')

  // 更新单个用户
  const updatedUser = await prisma.user.update({
    where: { id: 1 },
    data: {
      age: 26,
      name: 'John Updated'
    }
  })
  console.log('更新用户:', updatedUser)

  // 批量更新
  const updateManyResult = await prisma.user.updateMany({
    where: {
      age: {
        lt: 25
      }
    },
    data: {
      age: {
        increment: 1
      }
    }
  })
  console.log(`批量更新了 ${updateManyResult.count} 个用户`)

  // 更新或创建
  const upsertResult = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: { age: 100 },
    create: {
      email: 'john@example.com',
      name: 'John New',
      age: 18
    }
  })
  console.log('更新或创建:', upsertResult, '\n')

  // ==================== 4. 删除用户 ====================
  console.log('=== 4. 删除用户 ===')

  // 删除单个用户
  await prisma.user.delete({
    where: { id: 3 }
  })
  console.log('删除了 ID=3 的用户')

  // 批量删除
  const deleteManyResult = await prisma.user.deleteMany({
    where: {
      name: {
        contains: 'User'
      }
    }
  })
  console.log(`批量删除了 ${deleteManyResult.count} 个用户`)

  // 查看剩余用户
  const remainingUsers = await prisma.user.findMany()
  console.log('剩余用户:', remainingUsers, '\n')

  console.log('✅ 用户管理示例完成！')
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export {}
