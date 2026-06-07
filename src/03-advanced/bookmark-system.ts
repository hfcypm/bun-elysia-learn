/**
 * Level 3 - 实战项目：书签系统
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 开发完整业务系统
 * 2. ✅ 实现 28 个 API 端点
 * 3. ✅ 实现书签 CRUD
 * 4. ✅ 实现标签管理
 * 5. ✅ 实现分类管理
 * 
 * ⚠️ 注意事项：
 * - 代码量大，分步学习
 * - 先理解数据模型
 * - 参考文档说明
 * - 测试每个端点
 * 
 * 📝 练习任务：
 * - 添加搜索功能
 * - 实现书签导入
 * - 添加用户权限
 * 
 * 🔗 相关文档：
 * - docs/13-BOOKMARK_SYSTEM_GUIDE.md - 书签系统
 * - docs/00-README.md - 学习指南
 * 
 * 运行：bun run src/03-advanced/bookmark-system.ts
 * 测试：http://localhost:3021
 */

import { Elysia, t } from 'elysia'
import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
})

// ==================== 辅助函数 ====================

// 书签列表响应转换器
function bookmarkListResponse(bookmark: any) {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description,
    icon: bookmark.icon,
    isFavorite: bookmark.isFavorite,
    isArchived: bookmark.isArchived,
    visitCount: bookmark.visitCount,
    lastVisited: bookmark.lastVisited,
    user: {
      id: bookmark.user.id,
      username: bookmark.user.username
    },
    tags: bookmark.tags.map((t: any) => ({
      id: t.tag.id,
      name: t.tag.name,
      color: t.tag.color
    })),
    collections: bookmark.collections.map((c: any) => ({
      id: c.collection.id,
      name: c.collection.name,
      color: c.collection.color
    })),
    commentsCount: bookmark._count?.comments || 0,
    createdAt: bookmark.createdAt,
    updatedAt: bookmark.updatedAt
  }
}

// 书签详情响应转换器
function bookmarkDetailResponse(bookmark: any) {
  return {
    ...bookmarkListResponse(bookmark),
    comments: bookmark.comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      author: {
        id: c.author.id,
        username: c.author.username
      },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
  }
}

// ==================== API 定义 ====================

const app = new Elysia()
  // ===== 首页 =====
  .get('/', () => ({
    name: '🔖 在线书签管理系统',
    version: '1.0.0',
    description: '基于 Elysia.js + Prisma 的完整 CRUD 系统',
    features: [
      '用户管理',
      '书签 CRUD',
      '收藏夹管理',
      '标签系统',
      '搜索筛选',
      '统计分析',
      '评论功能'
    ],
    quickStart: {
      users: '/api/users',
      bookmarks: '/api/bookmarks',
      collections: '/api/collections',
      tags: '/api/tags',
      stats: '/api/stats'
    }
  }))

  // ==================== 用户模块 ====================
  .group('/api/users', app => app
    // GET /api/users - 用户列表
    .get('/', async ({ query }) => {
      const { page = '1', limit = '10' } = query as any

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
            bio: true,
            createdAt: true,
            _count: {
              select: {
                bookmarks: true,
                collections: true
              }
            }
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ])

      return {
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })

    // GET /api/users/:id - 用户详情
    .get('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          createdAt: true,
          bookmarks: {
            select: {
              id: true,
              title: true,
              url: true,
              isFavorite: true,
              isArchived: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          collections: {
            select: {
              id: true,
              name: true,
              color: true,
              _count: {
                select: { bookmarks: true }
              }
            }
          },
          _count: {
            select: {
              bookmarks: true,
              collections: true,
              comments: true
            }
          }
        }
      })

      if (!user) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      return { success: true, data: user }
    })

    // POST /api/users - 创建用户
    .post('/', async ({ body, set }) => {
      const { username, email, password, role = 'user', avatar, bio } = body

      try {
        const user = await prisma.user.create({
          data: { username, email, password, role, avatar, bio },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
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
        role: t.Optional(t.String()),
        avatar: t.Optional(t.String()),
        bio: t.Optional(t.String())
      })
    })

    // PUT /api/users/:id - 更新用户
    .put('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { avatar, bio } = body

      try {
        const user = await prisma.user.update({
          where: { id },
          data: { avatar, bio },
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            bio: true,
            updatedAt: true
          }
        })

        return { success: true, message: '用户更新成功', data: user }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '用户不存在' }
        }
        throw error
      }
    }, {
      body: t.Object({
        avatar: t.Optional(t.String()),
        bio: t.Optional(t.String())
      })
    })

    // DELETE /api/users/:id - 删除用户
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.user.delete({ where: { id } })
        return { success: true, message: '用户删除成功' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '用户不存在' }
        }
        throw error
      }
    })
  )

  // ==================== 书签模块 ====================
  .group('/api/bookmarks', app => app
    // GET /api/bookmarks - 书签列表 (支持筛选/搜索/分页)
    .get('/', async ({ query }) => {
      const {
        page = '1',
        limit = '20',
        userId,
        collectionId,
        tagId,
        isFavorite,
        isArchived,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query as any

      const where: any = {}

      if (userId) where.userId = parseInt(userId)
      if (isArchived === 'true') where.isArchived = true
      if (isArchived === 'false') where.isArchived = false
      if (isFavorite === 'true') where.isFavorite = true

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { url: { contains: search } }
        ]
      }

      if (tagId) {
        where.tags = {
          some: { tagId: parseInt(tagId) }
        }
      }

      if (collectionId) {
        where.collections = {
          some: { collectionId: parseInt(collectionId) }
        }
      }

      const orderBy: any = {}
      orderBy[sortBy] = sortOrder

      const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
          where,
          include: {
            user: { select: { id: true, username: true } },
            tags: { include: { tag: true } },
            collections: { include: { collection: true } },
            _count: { select: { comments: true } }
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy
        }),
        prisma.bookmark.count({ where })
      ])

      return {
        success: true,
        data: bookmarks.map(bookmarkListResponse),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          userId,
          collectionId,
          tagId,
          isFavorite,
          isArchived,
          search
        }
      }
    })

    // GET /api/bookmarks/:id - 书签详情
    .get('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      const bookmark = await prisma.bookmark.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          tags: { include: { tag: true } },
          collections: { include: { collection: true } },
          comments: {
            include: {
              author: { select: { id: true, username: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!bookmark) {
        set.status = 404
        return { success: false, error: '书签不存在' }
      }

      // 增加访问计数
      await prisma.bookmark.update({
        where: { id },
        data: {
          visitCount: { increment: 1 },
          lastVisited: new Date()
        }
      })

      return {
        success: true,
        data: bookmarkDetailResponse({
          ...bookmark,
          visitCount: bookmark.visitCount + 1
        })
      }
    })

    // POST /api/bookmarks - 创建书签
    .post('/', async ({ body, set }) => {
      const { title, url, description, userId, tagIds, collectionIds, icon } = body

      try {
        const bookmark = await prisma.$transaction(async (tx) => {
          const newBookmark = await tx.bookmark.create({
            data: {
              title,
              url,
              description,
              icon,
              userId,
              tags: tagIds ? {
                create: tagIds.map((id: number) => ({ tagId: id }))
              } : undefined,
              collections: collectionIds ? {
                create: collectionIds.map((id: number) => ({ collectionId: id }))
              } : undefined
            },
            include: {
              user: true,
              tags: { include: { tag: true } },
              collections: { include: { collection: true } }
            }
          })

          // 更新收藏夹的书签计数
          if (collectionIds) {
            for (const collectionId of collectionIds) {
              await tx.collection.update({
                where: { id: collectionId },
                data: { updatedAt: new Date() }
              })
            }
          }

          return newBookmark
        })

        set.status = 201
        return {
          success: true,
          message: '书签创建成功',
          data: bookmarkListResponse(bookmark)
        }
      } catch (error: any) {
        set.status = 400
        return { success: false, error: error.message }
      }
    }, {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        url: t.String({ minLength: 1, maxLength: 2048 }),
        description: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        userId: t.Number(),
        tagIds: t.Optional(t.Array(t.Number())),
        collectionIds: t.Optional(t.Array(t.Number()))
      })
    })

    // PATCH /api/bookmarks/:id - 部分更新书签
    .patch('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { title, description, icon, isFavorite, isArchived } = body

      try {
        const bookmark = await prisma.bookmark.update({
          where: { id },
          data: { title, description, icon, isFavorite, isArchived },
          include: {
            user: true,
            tags: { include: { tag: true } },
            collections: { include: { collection: true } }
          }
        })

        return {
          success: true,
          message: '书签更新成功',
          data: bookmarkListResponse(bookmark)
        }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '书签不存在' }
        }
        throw error
      }
    }, {
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        isFavorite: t.Optional(t.Boolean()),
        isArchived: t.Optional(t.Boolean())
      })
    })

    // PUT /api/bookmarks/:id/tags - 更新书签标签
    .put('/:id/tags', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { tagIds } = body

      try {
        await prisma.$transaction(async (tx) => {
          // 删除现有标签关联
          await tx.bookmarkTag.deleteMany({
            where: { bookmarkId: id }
          })

          // 创建新的标签关联
          if (tagIds && tagIds.length > 0) {
            await tx.bookmarkTag.createMany({
              data: tagIds.map((tagId: number) => ({
                bookmarkId: id,
                tagId
              }))
            })
          }
        })

        const bookmark = await prisma.bookmark.findUnique({
          where: { id },
          include: { tags: { include: { tag: true } } }
        })

        return {
          success: true,
          message: '标签更新成功',
          data: bookmark?.tags.map((t: any) => ({
            id: t.tag.id,
            name: t.tag.name,
            color: t.tag.color
          }))
        }
      } catch (error: any) {
        set.status = 400
        return { success: false, error: error.message }
      }
    }, {
      body: t.Object({
        tagIds: t.Array(t.Number())
      })
    })

    // DELETE /api/bookmarks/:id - 删除书签
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.bookmark.delete({ where: { id } })
        return { success: true, message: '书签删除成功' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '书签不存在' }
        }
        throw error
      }
    })

    // POST /api/bookmarks/batch-import - 批量导入书签
    .post('/batch-import', async ({ body, set }) => {
      const { userId, bookmarks } = body as {
        userId: number
        bookmarks: Array<{
          title: string
          url: string
          description?: string
        }>
      }

      try {
        const result = await prisma.bookmark.createMany({
          data: bookmarks.map(b => ({
            userId,
            title: b.title,
            url: b.url,
            description: b.description
          })),
          skipDuplicates: true
        })

        return {
          success: true,
          message: `成功导入 ${result.count} 个书签`,
          data: result
        }
      } catch (error: any) {
        set.status = 400
        return { success: false, error: error.message }
      }
    }, {
      body: t.Object({
        userId: t.Number(),
        bookmarks: t.Array(t.Object({
          title: t.String(),
          url: t.String(),
          description: t.Optional(t.String())
        }))
      })
    })
  )

  // ==================== 收藏夹模块 ====================
  .group('/api/collections', app => app
    // GET /api/collections - 收藏夹列表
    .get('/', async ({ query }) => {
      const { userId, isPublic } = query as any
      const where: any = {}

      if (userId) where.userId = parseInt(userId)
      if (isPublic === 'true') where.isPublic = true

      const collections = await prisma.collection.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          _count: { select: { bookmarks: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, data: collections }
    })

    // GET /api/collections/:id - 收藏夹详情
    .get('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          bookmarks: {
            include: {
              bookmark: {
                include: {
                  user: { select: { id: true, username: true } },
                  tags: { include: { tag: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!collection) {
        set.status = 404
        return { success: false, error: '收藏夹不存在' }
      }

      return {
        success: true,
        data: {
          ...collection,
          bookmarks: collection.bookmarks.map((cb: any) => cb.bookmark)
        }
      }
    })

    // POST /api/collections - 创建收藏夹
    .post('/', async ({ body, set }) => {
      const { name, description, color, isPublic, userId } = body

      try {
        const collection = await prisma.collection.create({
          data: { name, description, color, isPublic, userId },
          include: {
            user: true,
            _count: { select: { bookmarks: true } }
          }
        })

        set.status = 201
        return {
          success: true,
          message: '收藏夹创建成功',
          data: collection
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          set.status = 409
          return { success: false, error: '该用户已存在同名收藏夹' }
        }
        throw error
      }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        userId: t.Number()
      })
    })

    // PUT /api/collections/:id - 更新收藏夹
    .put('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { name, description, color, isPublic } = body

      try {
        const collection = await prisma.collection.update({
          where: { id },
          data: { name, description, color, isPublic },
          include: {
            user: true,
            _count: { select: { bookmarks: true } }
          }
        })

        return { success: true, message: '收藏夹更新成功', data: collection }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '收藏夹不存在' }
        }
        if (error.code === 'P2002') {
          set.status = 409
          return { success: false, error: '该用户已存在同名收藏夹' }
        }
        throw error
      }
    }, {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean())
      })
    })

    // DELETE /api/collections/:id - 删除收藏夹
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.collection.delete({ where: { id } })
        return { success: true, message: '收藏夹删除成功' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '收藏夹不存在' }
        }
        throw error
      }
    })

    // POST /api/collections/:id/bookmarks/:bookmarkId - 添加书签到收藏夹
    .post('/:id/bookmarks/:bookmarkId', async ({ params, set }) => {
      const collectionId = parseInt(params.id)
      const bookmarkId = parseInt(params.bookmarkId)

      try {
        await prisma.collectionBookmark.create({
          data: { collectionId, bookmarkId }
        })

        return { success: true, message: '书签已添加到收藏夹' }
      } catch (error: any) {
        if (error.code === 'P2002') {
          return { success: false, error: '书签已在该收藏夹中' }
        }
        throw error
      }
    })

    // DELETE /api/collections/:id/bookmarks/:bookmarkId - 从收藏夹移除书签
    .delete('/:id/bookmarks/:bookmarkId', async ({ params, set }) => {
      const collectionId = parseInt(params.id)
      const bookmarkId = parseInt(params.bookmarkId)

      try {
        await prisma.collectionBookmark.delete({
          where: {
            collectionId_bookmarkId: {
              collectionId,
              bookmarkId
            }
          }
        })

        return { success: true, message: '书签已从收藏夹移除' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '收藏关系不存在' }
        }
        throw error
      }
    })
  )

  // ==================== 标签模块 ====================
  .group('/api/tags', app => app
    // GET /api/tags - 标签列表
    .get('/', async () => {
      const tags = await prisma.tag.findMany({
        include: {
          _count: { select: { bookmarks: true } }
        },
        orderBy: { name: 'asc' }
      })

      return { success: true, data: tags }
    })

    // POST /api/tags - 创建标签
    .post('/', async ({ body, set }) => {
      const { name, color = '#666666' } = body

      try {
        const tag = await prisma.tag.create({
          data: { name, color },
          include: {
            _count: { select: { bookmarks: true } }
          }
        })

        set.status = 201
        return { success: true, message: '标签创建成功', data: tag }
      } catch (error: any) {
        if (error.code === 'P2002') {
          set.status = 409
          return { success: false, error: '标签已存在' }
        }
        throw error
      }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        color: t.Optional(t.String())
      })
    })

    // PUT /api/tags/:id - 更新标签
    .put('/:id', async ({ params, body, set }) => {
      const id = parseInt(params.id)
      const { name, color } = body

      try {
        const tag = await prisma.tag.update({
          where: { id },
          data: { name, color },
          include: {
            _count: { select: { bookmarks: true } }
          }
        })

        return { success: true, message: '标签更新成功', data: tag }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '标签不存在' }
        }
        if (error.code === 'P2002') {
          set.status = 409
          return { success: false, error: '标签已存在' }
        }
        throw error
      }
    }, {
      body: t.Object({
        name: t.Optional(t.String()),
        color: t.Optional(t.String())
      })
    })

    // DELETE /api/tags/:id - 删除标签
    .delete('/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.tag.delete({ where: { id } })
        return { success: true, message: '标签删除成功' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '标签不存在' }
        }
        throw error
      }
    })
  )

  // ==================== 评论模块 ====================
  .group('/api/bookmarks/:bookmarkId/comments', app => app
    // GET /api/bookmarks/:bookmarkId/comments - 评论列表
    .get('/', async ({ params }) => {
      const bookmarkId = parseInt(params.bookmarkId)

      const comments = await prisma.comment.findMany({
        where: { bookmarkId },
        include: {
          author: { select: { id: true, username: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return { success: true, count: comments.length, data: comments }
    })

    // POST /api/bookmarks/:bookmarkId/comments - 创建评论
    .post('/', async ({ params, body, set }) => {
      const bookmarkId = parseInt(params.bookmarkId)
      const { authorId, content } = body

      try {
        const comment = await prisma.comment.create({
          data: { bookmarkId, authorId, content },
          include: {
            author: { select: { id: true, username: true, avatar: true } }
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
        return { success: false, error: error.message }
      }
    }, {
      body: t.Object({
        authorId: t.Number(),
        content: t.String({ minLength: 1, maxLength: 1000 })
      })
    })

    // DELETE /api/comments/:id - 删除评论
    .delete('/comments/:id', async ({ params, set }) => {
      const id = parseInt(params.id)

      try {
        await prisma.comment.delete({ where: { id } })
        return { success: true, message: '评论删除成功' }
      } catch (error: any) {
        if (error.code === 'P2025') {
          set.status = 404
          return { success: false, error: '评论不存在' }
        }
        throw error
      }
    })
  )

  // ==================== 统计模块 ====================
  .get('/api/stats', async () => {
    const [
      userCount,
      bookmarkCount,
      collectionCount,
      tagCount,
      commentCount,
      favoriteCount,
      archivedCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bookmark.count(),
      prisma.collection.count(),
      prisma.tag.count(),
      prisma.comment.count(),
      prisma.bookmark.count({ where: { isFavorite: true } }),
      prisma.bookmark.count({ where: { isArchived: true } })
    ])

    // 热门标签
    const topTags = await prisma.tag.findMany({
      include: {
        _count: { select: { bookmarks: true } }
      },
      orderBy: { bookmarks: { _count: 'desc' } },
      take: 10
    })

    // 活跃用户 (书签数前 5)
    const topUsers = await prisma.user.findMany({
      include: {
        _count: { select: { bookmarks: true } }
      },
      orderBy: { bookmarks: { _count: 'desc' } },
      take: 5
    })

    // 最近书签
    const recentBookmarks = await prisma.bookmark.findMany({
      include: {
        user: { select: { username: true } },
        tags: { include: { tag: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return {
      success: true,
      overview: {
        users: userCount,
        bookmarks: bookmarkCount,
        collections: collectionCount,
        tags: tagCount,
        comments: commentCount,
        favorites: favoriteCount,
        archived: archivedCount
      },
      topTags,
      topUsers,
      recentBookmarks
    }
  })

  // ==================== 搜索模块 ====================
  .get('/api/search', async ({ query }) => {
    const { q, type = 'all', page = '1', limit = '20' } = query as any

    if (!q) {
      return { success: false, error: '请提供搜索关键词' }
    }

    const results: any = {}

    if (type === 'all' || type === 'bookmarks') {
      results.bookmarks = await prisma.bookmark.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { url: { contains: q } }
          ]
        },
        include: {
          user: { select: { username: true } },
          tags: { include: { tag: true } }
        },
        take: parseInt(limit)
      })
    }

    if (type === 'all' || type === 'collections') {
      results.collections = await prisma.collection.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } }
          ]
        },
        include: {
          user: { select: { username: true } },
          _count: { select: { bookmarks: true } }
        },
        take: parseInt(limit)
      })
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { bio: { contains: q } }
          ]
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          _count: { select: { bookmarks: true } }
        },
        take: parseInt(limit)
      })
    }

    return {
      success: true,
      query: q,
      type,
      results
    }
  })

  // ==================== 数据库管理 ====================
  .post('/api/db/reset', async () => {
    try {
      // 按依赖顺序删除数据
      await prisma.comment.deleteMany({})
      await prisma.bookmarkTag.deleteMany({})
      await prisma.collectionBookmark.deleteMany({})
      await prisma.bookmark.deleteMany({})
      await prisma.collection.deleteMany({})
      await prisma.tag.deleteMany({})
      await prisma.user.deleteMany({})

      return { success: true, message: '数据库已重置' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .post('/api/db/seed', async () => {
    try {
      // 创建测试用户
      const users = await Promise.all([
        prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@example.com',
            password: 'hashed_password',
            role: 'admin',
            bio: '系统管理员'
          }
        }),
        prisma.user.create({
          data: {
            username: 'user1',
            email: 'user1@example.com',
            password: 'hashed_password',
            role: 'user',
            bio: '书签爱好者'
          }
        })
      ])

      // 创建标签
      const tags = await Promise.all([
        prisma.tag.create({ data: { name: '技术', color: '#3178C6' } }),
        prisma.tag.create({ data: { name: '教程', color: '#28A745' } }),
        prisma.tag.create({ data: { name: '工具', color: '#F938AB' } }),
        prisma.tag.create({ data: { name: '阅读', color: '#FFA500' } }),
        prisma.tag.create({ data: { name: '收藏', color: '#9C27B0' } })
      ])

      // 创建收藏夹
      const collections = await Promise.all([
        prisma.collection.create({
          data: {
            name: '学习资源',
            description: '各类学习教程和文档',
            color: '#2196F3',
            userId: users[0].id
          }
        }),
        prisma.collection.create({
          data: {
            name: '常用工具',
            description: '日常使用的在线工具',
            color: '#4CAF50',
            userId: users[0].id
          }
        })
      ])

      // 创建书签
      const bookmarks = await Promise.all([
        prisma.bookmark.create({
          data: {
            title: 'Elysia.js 官方文档',
            url: 'https://elysiajs.com',
            description: '高性能 Web 框架',
            userId: users[0].id,
            isFavorite: true
          }
        }),
        prisma.bookmark.create({
          data: {
            title: 'Prisma 官方文档',
            url: 'https://www.prisma.io/docs',
            description: '下一代 ORM',
            userId: users[0].id,
            isFavorite: true
          }
        }),
        prisma.bookmark.create({
          data: {
            title: 'TypeScript  Handbook',
            url: 'https://www.typescriptlang.org/docs/',
            description: 'TypeScript 官方文档',
            userId: users[1].id
          }
        })
      ])

      // 关联书签和标签
      await prisma.bookmarkTag.create({
        data: { bookmarkId: bookmarks[0].id, tagId: tags[0].id }
      })
      await prisma.bookmarkTag.create({
        data: { bookmarkId: bookmarks[1].id, tagId: tags[0].id }
      })
      await prisma.bookmarkTag.create({
        data: { bookmarkId: bookmarks[2].id, tagId: tags[1].id }
      })

      // 关联书签和收藏夹
      await prisma.collectionBookmark.create({
        data: { collectionId: collections[0].id, bookmarkId: bookmarks[0].id }
      })
      await prisma.collectionBookmark.create({
        data: { collectionId: collections[0].id, bookmarkId: bookmarks[1].id }
      })
      await prisma.collectionBookmark.create({
        data: { collectionId: collections[1].id, bookmarkId: bookmarks[2].id }
      })

      // 创建评论
      await prisma.comment.create({
        data: {
          bookmarkId: bookmarks[0].id,
          authorId: users[1].id,
          content: '非常好的框架，性能出色！'
        }
      })

      return {
        success: true,
        message: '种子数据创建成功',
        data: {
          users: users.length,
          tags: tags.length,
          collections: collections.length,
          bookmarks: bookmarks.length
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  .listen(3021)

console.log('🔖 书签管理系统运行在 http://localhost:3021')
console.log('📖 API 端点:')
console.log('')
console.log('=== 用户管理 ===')
console.log('GET    /api/users              - 用户列表')
console.log('GET    /api/users/:id          - 用户详情')
console.log('POST   /api/users              - 创建用户')
console.log('PUT    /api/users/:id          - 更新用户')
console.log('DELETE /api/users/:id          - 删除用户')
console.log('')
console.log('=== 书签管理 ===')
console.log('GET    /api/bookmarks          - 书签列表 (支持筛选/搜索/分页)')
console.log('GET    /api/bookmarks/:id      - 书签详情')
console.log('POST   /api/bookmarks          - 创建书签')
console.log('PATCH  /api/bookmarks/:id      - 部分更新')
console.log('PUT    /api/bookmarks/:id/tags - 更新标签')
console.log('DELETE /api/bookmarks/:id      - 删除书签')
console.log('POST   /api/bookmarks/batch-import - 批量导入')
console.log('')
console.log('=== 收藏夹管理 ===')
console.log('GET    /api/collections                           - 收藏夹列表')
console.log('GET    /api/collections/:id                       - 收藏夹详情')
console.log('POST   /api/collections                           - 创建收藏夹')
console.log('PUT    /api/collections/:id                       - 更新收藏夹')
console.log('DELETE /api/collections/:id                       - 删除收藏夹')
console.log('POST   /api/collections/:id/bookmarks/:bookmarkId - 添加书签')
console.log('DELETE /api/collections/:id/bookmarks/:bookmarkId - 移除书签')
console.log('')
console.log('=== 标签管理 ===')
console.log('GET    /api/tags       - 标签列表')
console.log('POST   /api/tags       - 创建标签')
console.log('PUT    /api/tags/:id   - 更新标签')
console.log('DELETE /api/tags/:id   - 删除标签')
console.log('')
console.log('=== 评论管理 ===')
console.log('GET    /api/bookmarks/:bookmarkId/comments - 评论列表')
console.log('POST   /api/bookmarks/:bookmarkId/comments - 创建评论')
console.log('DELETE /api/comments/:id                   - 删除评论')
console.log('')
console.log('=== 统计与搜索 ===')
console.log('GET /api/stats  - 系统统计')
console.log('GET /api/search?q=关键词 - 搜索')
console.log('')
console.log('=== 数据库管理 ===')
console.log('POST /api/db/reset - 重置数据库')
console.log('POST /api/db/seed  - 初始化种子数据')
console.log('')
console.log('💡 快速开始:')
console.log('   POST /api/db/seed  # 初始化测试数据')
console.log('   GET  /api/stats    # 查看系统统计')
console.log('   GET  /api/bookmarks # 浏览所有书签')

export type BookmarkSystemApp = typeof app
