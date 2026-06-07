/**
 * Level 2 - 进阶技能: 08 Prisma Orm
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 定义 Prisma Schema 数据模型
 * 2. ✅ 执行 prisma migrate 创建迁移
 * 3. ✅ 使用 PrismaClient 查询数据
 * 4. ✅ 实现 findMany/findFirst/create/update/delete
 * 5. ✅ 理解 ORM 的优势
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3020
 * - 运行前：bun x prisma generate
 * - 首次运行需要：bun x prisma migrate dev
 * - 确保数据库连接字符串正确
 * - 共21个 API 端点，分步测试
 * 
 * 📝 练习任务：
 * - 添加新的数据字段
 * - 实现批量创建
 * - 添加查询过滤
 * 
 * 🔗 相关文档：
- docs/00-README.md - 学习指南
- docs/00-INDEX.md - 文档导航
- docs/14-PRISMA_TUTORIAL.md - Prisma 完整教程
- docs/11-ELYSIA_PRISMA_INTEGRATION.md - Elysia+Prisma 集成
 * 
 * 运行：bun run src/02-intermediate/08-prisma-orm.ts
 * 测试：http://localhost:3020
 */

import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
})

console.log('💾 Prisma ORM 已初始化')

// ==================== API 定义 ====================
const app = new Elysia()
  // ===== 首页 =====
  .get('/', () => ({
    message: 'Prisma ORM 示例',
    features: [
      '类型安全的数据库操作',
      '自动模型生成',
      '关联查询',
      '事务支持',
      '自动迁移'
    ],
    endpoints: {
      users: '/users',
      posts: '/posts',
      tags: '/tags',
      db: '/db/stats'
    }
  }))

  // ===== 用户模块 =====
  .group('/users', app => app
    // GET /users - 获取所有用户
    .get('/', async () => {
      const users = await prisma.user.findMany({
        include: {
          posts: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: { posts: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return {
        success: true,
        count: users.length,
        data: users
      }
    })

    // GET /users/:id - 获取单个用户
    .get('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          posts: {
            include: {
              tags: true
            }
          }
        }
      })

      if (!user) {
        set.status = 404
        return {
          success: false,
          error: '用户不存在'
        }
      }

      return {
        success: true,
        data: user
      }
    })

    // GET /users/username/:username - 按用户名查询
    .get('/username/:username', async ({ params, set }) => {
      const { username } = params

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      if (!user) {
        set.status = 404
        return {
          success: false,
          error: '用户不存在'
        }
      }

      return {
        success: true,
        data: user
      }
    })

    // POST /users - 创建用户
    .post('/', async ({ body, set }) => {
      const { username, email, password, role = 'user' } = body

      try {
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password,
            role
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true
          }
        })

        set.status = 201
        return {
          success: true,
          message: '用户创建成功',
          data: user
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          set.status = 409
          return {
            success: false,
            error: '用户名或邮箱已存在',
            details: error.meta?.target
          }
        }
        throw error
      }
    }, {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 50 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.String())
      })
    })

    // PUT /users/:id - 更新用户
    .put('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { username, email, role } = body

      try {
        const user = await prisma.user.update({
          where: { id },
          data: {
            username,
            email,
            role
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            updatedAt: true
          }
        })

        return {
          success: true,
          message: '用户更新成功',
          data: user
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return {
            success: false,
            error: '用户不存在'
          }
        }
        if (error.code === 'P2002') {
          set.status = 409
          return {
            success: false,
            error: '用户名或邮箱已存在'
          }
        }
        throw error
      }
    }, {
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String())
      })
    })

    // DELETE /users/:id - 删除用户
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.user.delete({
          where: { id }
        })

        return {
          success: true,
          message: '用户删除成功'
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return {
            success: false,
            error: '用户不存在'
          }
        }
        throw error
      }
    })
  )

  // ===== 文章模块 =====
  .group('/posts', app => app
    // GET /posts - 获取所有文章 (支持筛选)
    .get('/', async ({ query }) => {
      const { status, authorId, tag, search, page = '1', limit = '10' } = query as any

      // 构建筛选条件
      const where: any = {}

      if (status) {
        where.status = status
      }

      if (authorId) {
        where.authorId = parseInt(authorId)
      }

      if (tag) {
        where.tags = {
          some: {
            name: tag
          }
        }
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } }
        ]
      }

      // 分页
      const skip = (parseInt(page) - 1) * parseInt(limit)

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            tags: true,
            _count: {
              select: { comments: true }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.post.count({ where })
      ])

      return {
        success: true,
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })

    // GET /posts/:id - 获取文章详情
    .get('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          tags: true,
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!post) {
        set.status = 404
        return {
          success: false,
          error: '文章不存在'
        }
      }

      // 增加阅读数
      await prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      })

      return {
        success: true,
        data: post
      }
    })

    // POST /posts - 创建文章
    .post('/', async ({ body, set }) => {
      const { title, content, authorId, status = 'draft', tagIds } = body

      try {
        const post = await prisma.$transaction(async (tx) => {
          // 创建文章
          const newPost = await tx.post.create({
            data: {
              title,
              content,
              authorId,
              status,
              tags: tagIds ? {
                connect: tagIds.map((id: number) => ({ id }))
              } : undefined
            },
            include: {
              author: true,
              tags: true
            }
          })

          return newPost
        })

        set.status = 201
        return {
          success: true,
          message: '文章创建成功',
          data: post
        }
      } catch (error: any) {
        set.status = 400
        return {
          success: false,
          error: error.message
        }
      }
    }, {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        content: t.String(),
        authorId: t.Number(),
        status: t.Optional(t.String()),
        tagIds: t.Optional(t.Array(t.Number()))
      })
    })

    // PUT /posts/:id - 更新文章
    .put('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { title, content, status, tagIds } = body

      try {
        const post = await prisma.$transaction(async (tx) => {
          // 更新文章
          const updated = await tx.post.update({
            where: { id },
            data: {
              title,
              content,
              status,
              tags: tagIds ? {
                set: tagIds.map((id: number) => ({ id }))
              } : undefined
            },
            include: {
              author: true,
              tags: true
            }
          })

          return updated
        })

        return {
          success: true,
          message: '文章更新成功',
          data: post
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return {
            success: false,
            error: '文章不存在'
          }
        }
        set.status = 400
        return {
          success: false,
          error: error.message
        }
      }
    }, {
      body: t.Object({
        title: t.Optional(t.String()),
        content: t.Optional(t.String()),
        status: t.Optional(t.String()),
        tagIds: t.Optional(t.Array(t.Number()))
      })
    })

    // DELETE /posts/:id - 删除文章
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.post.delete({
          where: { id }
        })

        return {
          success: true,
          message: '文章删除成功'
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return {
            success: false,
            error: '文章不存在'
          }
        }
        throw error
      }
    })
  )

  // ===== 标签模块 =====
  .group('/tags', app => app
    // GET /tags - 获取所有标签
    .get('/', async () => {
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      return {
        success: true,
        count: tags.length,
        data: tags
      }
    })

    // POST /tags - 创建标签
    .post('/', async ({ body, set }) => {
      const { name, color = '#666666' } = body

      try {
        const tag = await prisma.tag.create({
          data: { name, color },
          include: {
            _count: {
              select: { posts: true }
            }
          }
        })

        set.status = 201
        return {
          success: true,
          message: '标签创建成功',
          data: tag
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          set.status = 409
          return {
            success: false,
            error: '标签已存在'
          }
        }
        throw error
      }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        color: t.Optional(t.String())
      })
    })
  )

  // ===== 模块 =====
  .group('/posts/:postId/comments', app => app
    // GET /posts/:postId/comments - 获取评论列表
    .get('/', async ({ params }) => {
      const postId = parseInt(params.postId)

      const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        count: comments.length,
        data: comments
      }
    })

    // POST /posts/:postId/comments - 创建评论
    .post('/', async ({ params, body, set }) => {
      const postId = parseInt(params.postId)
      const { authorId, content } = body

      try {
        const comment = await prisma.comment.create({
          data: {
            postId,
            authorId,
            content
          },
          include: {
            author: {
              select: {
                id: true,
                username: true
              }
            }
          }
        })

        set.status = 201
        return {
          success: true,
          message: '评论创建成功',
          data: comment
        }
      } catch (error: any) {
        set.status = 400
        return {
          success: false,
          error: error.message
        }
      }
    }, {
      body: t.Object({
        authorId: t.Number(),
        content: t.String({ minLength: 1, maxLength: 1000 })
      })
    })
  )

  // ===== 数据库统计 =====
  .get('/db/stats', async () => {
    const [userCount, postCount, tagCount, commentCount, publishedCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.tag.count(),
      prisma.comment.count(),
      prisma.post.count({ where: { status: 'published' } })
    ])

    return {
      success: true,
      data: {
        users: userCount,
        posts: postCount,
        tags: tagCount,
        comments: commentCount,
        publishedPosts: publishedCount
      }
    }
  })

  // ===== 高级查询示例 =====
  .get('/db/advanced-query', async () => {
    // 示例 1：获取热门作者 (文章数最多的前 3 名)
    const topAuthors = await prisma.user.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: 3
    })

    // 示例 2：获取最新文章 (包含作者和标签)
    const latestPosts = await prisma.post.findMany({
      where: {
        status: 'published'
      },
      include: {
        author: {
          select: {
            username: true,
            email: true
          }
        },
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // 示例 3：聚合查询 - 每篇文章的平均阅读数
    const avgStats = await prisma.post.aggregate({
      _avg: {
        viewCount: true
      },
      _sum: {
        viewCount: true
      },
      _count: true
    })

    return {
      success: true,
      advancedQueries: {
        topAuthors,
        latestPosts,
        postStats: avgStats
      }
    }
  })

  // ===== 事务示例 =====
  .post('/db/transaction-example', async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. 创建新用户
        const user = await tx.user.create({
          data: {
            username: `user_${Date.now()}`,
            email: `user_${Date.now()}@example.com`,
            password: 'hashed_password',
            role: 'user'
          }
        })

        // 2. 为用户创建第一篇文章
        const post = await tx.post.create({
          data: {
            title: '我的第一篇文章',
            content: '这是使用事务创建的内容...',
            authorId: user.id,
            status: 'draft'
          }
        })

        // 3. 添加标签
        const tag = await tx.tag.findFirst()
        if (tag) {
          await tx.post.update({
            where: { id: post.id },
            data: {
              tags: {
                connect: { id: tag.id }
              }
            }
          })
        }

        return { user, post }
      })

      return {
        success: true,
        message: '事务执行成功',
        data: result
      }
    } catch (error: any) {
      return {
        success: false,
        error: '事务失败',
        message: error.message
      }
    }
  })

  // ===== 批量操作示例 =====
  .post('/db/batch-create', async ({ body }) => {
    const { users } = body as { users: Array<{ username: string; email: string }> }

    // 批量创建用户
    const created = await prisma.user.createMany({
      data: users.map(u => ({
        username: u.username,
        email: u.email,
        password: 'default_password'
      })),
      skipDuplicates: true
    })

    return {
      success: true,
      message: `批量创建了 ${created.count} 个用户`,
      data: created
    }
  }, {
    body: t.Object({
      users: t.Array(t.Object({
        username: t.String(),
        email: t.String()
      }))
    })
  })

  // ===== 数据库重置 =====
  .post('/db/reset', async () => {
    try {
      // 按依赖顺序删除数据
      await prisma.comment.deleteMany({})
      await prisma.post.deleteMany({})
      await prisma.tag.deleteMany({})
      await prisma.user.deleteMany({})

      return {
        success: true,
        message: '数据库已重置'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  .listen(3020)

console.log('🔷 Prisma ORM 服务运行在 http://localhost:3020')
console.log('📖 测试端点:')
console.log('   === 用户模块 ===')
console.log('   GET    /users - 获取所有用户')
console.log('   GET    /users/:id - 获取用户详情')
console.log('   GET    /users/username/:username - 按用户名查询')
console.log('   POST   /users - 创建用户')
console.log('   PUT    /users/:id - 更新用户')
console.log('   DELETE /users/:id - 删除用户')
console.log('   === 文章模块 ===')
console.log('   GET    /posts - 获取文章列表 (支持筛选分页)')
console.log('   GET    /posts?status=published - 已发布文章')
console.log('   GET    /posts?tag=TypeScript - 按标签筛选')
console.log('   GET    /posts/:id - 文章详情 (含评论)')
console.log('   POST   /posts - 创建文章')
console.log('   PUT    /posts/:id - 更新文章')
console.log('   DELETE /posts/:id - 删除文章')
console.log('   === 标签模块 ===')
console.log('   GET    /tags - 获取所有标签')
console.log('   POST   /tags - 创建标签')
console.log('   === 评论模块 ===')
console.log('   GET    /posts/1/comments - 获取评论')
console.log('   POST   /posts/1/comments - 创建评论')
console.log('   === 数据库管理 ===')
console.log('   GET    /db/stats - 统计信息')
console.log('   GET    /db/advanced-query - 高级查询示例')
console.log('   POST   /db/transaction-example - 事务示例')
console.log('   POST   /db/batch-create - 批量创建')
console.log('   POST   /db/reset - 重置数据库')
console.log('')
console.log('💡 Prisma 初始化命令:')
console.log('   bun x prisma init                    # 初始化 Prisma')
console.log('   bun x prisma migrate dev             # 创建并应用迁移')
console.log('   bun x prisma generate                # 生成 Prisma Client')
console.log('   bun x prisma studio                  # 打开 Prisma 可视化界面')

export type PrismaApp = typeof app
