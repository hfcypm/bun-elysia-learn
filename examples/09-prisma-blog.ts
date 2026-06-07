/**
 * 示例片段: Prisma Blog
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习 Prisma 实战用法
 * 2. ✅ 理解数据模型设计
 * 3. ✅ 掌握复杂查询
 * 4. ✅ 事务处理
 * 
 * ⚠️ 注意事项：
 * - 运行前需要 bun x prisma generate
 * - 确保数据库连接字符串正确
 * - 首次运行需要执行迁移
 * - 示例代码可直接复制
 * - 根据项目需求调整
 * - 参考完整案例深入学习
 * 
 * 📝 练习任务：
 * - 运行示例测试效果
 * - 修改参数观察变化
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/14-PRISMA_TUTORIAL.md - Prisma 完整教程
 * - docs/11-ELYSIA_PRISMA_INTEGRATION.md - Elysia+Prisma 集成
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/09-prisma-blog.ts
 * 测试：http://localhost:3000
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📝 Prisma 基础入门 - 博客系统\n')

  // ==================== 1. 创建基础数据 ====================
  console.log('=== 1. 创建基础数据 ===')

  // 创建作者
  const author1 = await prisma.author.create({
    data: {
      name: '张三',
      email: 'zhangsan@example.com'
    }
  })
  console.log('创建作者 1:', author1)

  const author2 = await prisma.author.create({
    data: {
      name: '李四',
      email: 'lisi@example.com'
    }
  })
  console.log('创建作者 2:', author2)

  // 创建标签
  const tag1 = await prisma.tag.create({ data: { name: 'TypeScript' } })
  const tag2 = await prisma.tag.create({ data: { name: 'Prisma' } })
  const tag3 = await prisma.tag.create({ data: { name: '教程' } })
  console.log('创建标签:', [tag1, tag2, tag3], '\n')

  // ==================== 2. 创建文章（带关联） ====================
  console.log('=== 2. 创建文章（带关联） ===')

  // 创建文章并关联作者和标签
  const post1 = await prisma.post.create({
    data: {
      title: 'Prisma 入门教程',
      content: 'Prisma 是新一代 ORM...',
      published: true,
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tag1.id } }},
          { tag: { connect: { id: tag2.id } }},
          { tag: { connect: { id: tag3.id }}}
        ]
      }
    },
    include: {
      author: true,
      tags: { include: { tag: true } }
    }
  })
  console.log('创建文章 1:', post1)

  const post2 = await prisma.post.create({
    data: {
      title: 'TypeScript 高级技巧',
      content: '深入理解 TypeScript...',
      published: true,
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tag1.id }}},
          { tag: { connect: { id: tag3.id }}}
        ]
      }
    }
  })
  console.log('创建文章 2:', post2)

  const post3 = await prisma.post.create({
    data: {
      title: '未发布的草稿',
      content: '这是草稿内容...',
      published: false,
      authorId: author2.id
    }
  })
  console.log('创建草稿:', post3, '\n')

  // ==================== 3. 查询文章（关联查询） ====================
  console.log('=== 3. 查询文章（关联查询） ===')

  // 查询所有文章（包含作者）
  const allPosts = await prisma.post.findMany({
    include: {
      author: true
    }
  })
  console.log('所有文章:', allPosts)

  // 查询已发布文章（包含作者和标签）
  const publishedPosts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: true,
      tags: { include: { tag: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  console.log('已发布文章:', publishedPosts)

  // 查询单个文章详情
  const postDetail = await prisma.post.findUnique({
    where: { id: post1.id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      comments: {
        include: {
          author: true
        }
      }
    }
  })
  console.log('文章详情:', postDetail, '\n')

  // ==================== 4. 创建评论 ====================
  console.log('=== 4. 创建评论 ===')

  // 创建评论
  const comment1 = await prisma.comment.create({
    data: {
      content: '非常好的教程！',
      postId: post1.id,
      authorId: author2.id
    },
    include: {
      author: true
    }
  })
  console.log('创建评论 1:', comment1)

  const comment2 = await prisma.comment.create({
    data: {
      content: '学到了很多，谢谢分享！',
      postId: post1.id,
      authorId: author1.id
    }
  })
  console.log('创建评论 2:', comment2)

  const comment3 = await prisma.comment.create({
    data: {
      content: '期待下一篇！',
      postId: post2.id,
      authorId: author2.id
    }
  })
  console.log('创建评论 3:', comment3, '\n')

  // ==================== 5. 统计与聚合 ====================
  console.log('=== 5. 统计与聚合 ===')

  // 统计
  const postCount = await prisma.post.count()
  const publishedCount = await prisma.post.count({ where: { published: true } })
  console.log('文章总数:', postCount)
  console.log('已发布:', publishedCount)

  // 作者的文章统计
  const authorsWithStats = await prisma.author.findMany({
    include: {
      _count: {
        select: {
          posts: true,
          comments: true
        }
      }
    }
  })
  console.log('作者统计:', authorsWithStats)

  // 标签使用统计
  const tagsWithStats = await prisma.tag.findMany({
    include: {
      _count: {
        select: { posts: true }
      }
    },
    orderBy: {
      posts: {
        _count: 'desc'
      }
    }
  })
  console.log('标签统计:', tagsWithStats, '\n')

  // ==================== 6. 更新操作 ====================
  console.log('=== 6. 更新操作 ===')

  // 发布草稿
  const updatedPost = await prisma.post.update({
    where: { id: post3.id },
    data: { published: true }
  })
  console.log('发布草稿:', updatedPost)

  // 增加浏览量
  await prisma.post.update({
    where: { id: post1.id },
    data: { viewCount: { increment: 10 } }
  })
  console.log('增加文章 1 的浏览量')

  // 更新文章
  const updatedPost2 = await prisma.post.update({
    where: { id: post2.id },
    data: {
      content: '更新后的内容...',
      updatedAt: new Date()
    }
  })
  console.log('更新文章 2\n')

  // ==================== 7. 复杂查询 ====================
  console.log('=== 7. 复杂查询 ===')

  // 查询某作者的所有已发布文章
  const authorPosts = await prisma.post.findMany({
    where: {
      authorId: author1.id,
      published: true
    },
    include: {
      author: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } }
    }
  })
  console.log('张三的已发布文章:', authorPosts)

  // 查询包含特定标签的文章
  const postsWithTag = await prisma.post.findMany({
    where: {
      tags: {
        some: {
          tag: {
            name: 'TypeScript'
          }
        }
      }
    },
    include: {
      author: true,
      tags: { include: { tag: true } }
    }
  })
  console.log('包含 TypeScript 标签的文章:', postsWithTag, '\n')

  // ==================== 8. 删除操作 ====================
  console.log('=== 8. 删除操作 ===')

  // 删除评论
  await prisma.comment.delete({ where: { id: comment3.id } })
  console.log('删除评论 3')

  // 删除草稿文章
  await prisma.post.delete({ where: { id: post3.id } })
  console.log('删除草稿文章')

  // 删除作者（级联删除相关文章和评论）
  await prisma.author.delete({ where: { id: author2.id } })
  console.log('删除作者 2（级联删除）\n')

  // ==================== 9. 最终数据 ====================
  console.log('=== 9. 最终数据 ===')

  const finalAuthors = await prisma.author.findMany({
    include: {
      _count: { select: { posts: true } }
    }
  })
  console.log('剩余作者:', finalAuthors)

  const finalPosts = await prisma.post.findMany({
    include: {
      author: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } }
    }
  })
  console.log('剩余文章:', finalPosts)

  console.log('\n✅ 博客系统示例完成！')
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
