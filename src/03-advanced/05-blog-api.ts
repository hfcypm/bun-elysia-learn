/**
 * Level 3 - 实战项目: Blog Api
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 开发完整的业务系统
 * 2. ✅ 实现用户认证和授权
 * 3. ✅ 处理复杂的数据关系
 * 4. ✅ 实现 WebSocket 实时通信
 * 5. ✅ 掌握 API 最佳实践
 * 
 * ⚠️ 注意事项：
 * - 注意代码组织和模块拆分
 * - 错误处理要完善
 * - 密码必须加密存储
 * - JWT 设置合理的过期时间
 * - 注意性能优化
 * 
 * 📝 练习任务：
 * - 扩展系统功能
 * - 添加单元测试
 * - 优化查询性能
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

// 数据模型
interface Author {
  id: number
  name: string
  email: string
  avatar?: string
}

interface Comment {
  id: number
  postId: number
  author: string
  content: string
  createdAt: string
}

interface Post {
  id: number
  title: string
  content: string
  authorId: number
  tags: string[]
  status: 'draft' | 'published'
  views: number
  createdAt: string
  updatedAt: string
}

// 模拟数据库
let authors: Author[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', avatar: 'https://example.com/avatar1.jpg' },
  { id: 2, name: '李四', email: 'lisi@example.com', avatar: 'https://example.com/avatar2.jpg' }
]

let posts: Post[] = [
  {
    id: 1,
    title: 'Elysia 入门教程',
    content: 'Elysia 是一个基于 Bun 的高性能 Web 框架...',
    authorId: 1,
    tags: ['elysia', 'typescript', 'tutorial'],
    status: 'published',
    views: 1234,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'TypeScript 高级技巧',
    content: '本文介绍 TypeScript 的一些高级用法...',
    authorId: 2,
    tags: ['typescript', 'advanced'],
    status: 'published',
    views: 567,
    createdAt: '2026-01-02T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z'
  }
]

let comments: Comment[] = [
  { id: 1, postId: 1, author: '读者 A', content: '写得很好！', createdAt: '2026-01-01T12:00:00.000Z' },
  { id: 2, postId: 1, author: '读者 B', content: '学习了，感谢分享！', createdAt: '2026-01-01T14:00:00.000Z' }
]

const app = new Elysia()
  // ========== 作者管理 ==========
  .group('/authors', app => app
    // 获取所有作者
    .get('/', () => {
      return {
        success: true,
        data: authors,
        total: authors.length
      }
    })

    // 获取单个作者
    .get('/:id', ({ params, set }) => {
      const author = authors.find(a => a.id === parseInt(params.id))
      if (!author) {
        set.status = 404
        return { success: false, message: '作者不存在' }
      }

      // 获取作者的文章
      const authorPosts = posts.filter(p => p.authorId === author.id && p.status === 'published')

      return {
        success: true,
        data: {
          ...author,
          postsCount: authorPosts.length
        }
      }
    })

    // 创建作者
    .post('/', ({ body, set }) => {
      const newAuthor: Author = {
        id: Math.max(...authors.map(a => a.id)) + 1,
        name: body.name,
        email: body.email,
        avatar: body.avatar
      }

      authors.push(newAuthor)
      set.status = 201

      return {
        success: true,
        message: '作者创建成功',
        data: newAuthor
      }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        avatar: t.Optional(t.String({ format: 'uri' }))
      })
    })
  )

  // ========== 文章管理 ==========
  .group('/posts', app => app
    // 获取文章列表 (带分页和筛选)
    .get('/', ({ query }) => {
      let filteredPosts = [...posts]

      // 按状态筛选
      if (query.status) {
        filteredPosts = filteredPosts.filter(p => p.status === query.status)
      }

      // 按标签筛选
      if (query.tag) {
        filteredPosts = filteredPosts.filter(p => p.tags.includes(query.tag))
      }

      // 按作者筛选
      if (query.authorId) {
        filteredPosts = filteredPosts.filter(p => p.authorId === query.authorId)
      }

      // 分页
      const page = query.page || 1
      const limit = query.limit || 10
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedPosts = filteredPosts.slice(start, end)

      // 关联作者信息
      const postsWithAuthors = paginatedPosts.map(post => {
        const author = authors.find(a => a.id === post.authorId)
        return {
          ...post,
          author: author ? { id: author.id, name: author.name } : null,
          commentsCount: comments.filter(c => c.postId === post.id).length
        }
      })

      return {
        success: true,
        data: postsWithAuthors,
        pagination: {
          page,
          limit,
          total: filteredPosts.length,
          totalPages: Math.ceil(filteredPosts.length / limit)
        }
      }
    }, {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
        status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published')])),
        tag: t.Optional(t.String()),
        authorId: t.Optional(t.Number())
      })
    })

    // 获取文章详情
    .get('/:id', ({ params, set }) => {
      const post = posts.find(p => p.id === parseInt(params.id))
      if (!post) {
        set.status = 404
        return { success: false, message: '文章不存在' }
      }

      // 增加阅读量
      post.views++

      const author = authors.find(a => a.id === post.authorId)
      const postComments = comments.filter(c => c.postId === post.id)

      return {
        success: true,
        data: {
          ...post,
          author: author ? { id: author.id, name: author.name, avatar: author.avatar } : null,
          comments: postComments
        }
      }
    })

    // 创建文章
    .post('/', ({ body, set }) => {
      // 验证作者是否存在
      const author = authors.find(a => a.id === body.authorId)
      if (!author) {
        set.status = 400
        return { success: false, message: '作者不存在' }
      }

      const newPost: Post = {
        id: Math.max(...posts.map(p => p.id)) + 1,
        title: body.title,
        content: body.content,
        authorId: body.authorId,
        tags: body.tags || [],
        status: body.status || 'draft',
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      posts.push(newPost)
      set.status = 201

      return {
        success: true,
        message: '文章创建成功',
        data: newPost
      }
    }, {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        content: t.String({ minLength: 1 }),
        authorId: t.Number(),
        tags: t.Optional(t.Array(t.String())),
        status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published')]))
      })
    })

    // 更新文章
    .put('/:id', ({ params, body, set }) => {
      const postIndex = posts.findIndex(p => p.id === parseInt(params.id))
      if (postIndex === -1) {
        set.status = 404
        return { success: false, message: '文章不存在' }
      }

      posts[postIndex] = {
        ...posts[postIndex],
        ...body,
        updatedAt: new Date().toISOString()
      }

      return {
        success: true,
        message: '文章更新成功',
        data: posts[postIndex]
      }
    }, {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        content: t.Optional(t.String({ minLength: 1 })),
        tags: t.Optional(t.Array(t.String())),
        status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published')]))
      })
    })

    // 删除文章
    .delete('/:id', ({ params, set }) => {
      const postIndex = posts.findIndex(p => p.id === parseInt(params.id))
      if (postIndex === -1) {
        set.status = 404
        return { success: false, message: '文章不存在' }
      }

      // 同时删除相关评论
      const postId = posts[postIndex].id
      comments = comments.filter(c => c.postId !== postId)
      posts.splice(postIndex, 1)

      return {
        success: true,
        message: '文章已删除'
      }
    })
  )

  // ========== 评论管理 ==========
  .group('/posts/:postId/comments', app => app
    // 获取文章评论
    .get('/', ({ params, set }) => {
      const post = posts.find(p => p.id === parseInt(params.postId))
      if (!post) {
        set.status = 404
        return { success: false, message: '文章不存在' }
      }

      const postComments = comments.filter(c => c.postId === parseInt(params.postId))

      return {
        success: true,
        data: postComments,
        total: postComments.length
      }
    })

    // 添加评论
    .post('/', ({ params, body, set }) => {
      const post = posts.find(p => p.id === parseInt(params.postId))
      if (!post) {
        set.status = 404
        return { success: false, message: '文章不存在' }
      }

      const newComment: Comment = {
        id: Math.max(...comments.map(c => c.id)) + 1,
        postId: post.id,
        author: body.author,
        content: body.content,
        createdAt: new Date().toISOString()
      }

      comments.push(newComment)
      set.status = 201

      return {
        success: true,
        message: '评论成功',
        data: newComment
      }
    }, {
      body: t.Object({
        author: t.String({ minLength: 1 }),
        content: t.String({ minLength: 1, maxLength: 1000 })
      })
    })
  )

  // ========== 统计接口 ==========
  .get('/stats', () => {
    const totalPosts = posts.length
    const publishedPosts = posts.filter(p => p.status === 'published').length
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0)
    const totalComments = comments.length

    return {
      success: true,
      data: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          drafts: totalPosts - publishedPosts
        },
        views: totalViews,
        comments: totalComments,
        authors: authors.length
      }
    }
  })

app.listen(3004, () => {
  console.log('🚀 博客 API 运行在 http://localhost:3004')
  console.log('📝 API 端点:')
  console.log('\n作者管理:')
  console.log('   GET    /authors         获取所有作者')
  console.log('   GET    /authors/:id     获取作者详情')
  console.log('   POST   /authors         创建作者')
  console.log('\n文章管理:')
  console.log('   GET    /posts           获取文章列表 (支持分页、筛选)')
  console.log('   GET    /posts/:id       获取文章详情 (含评论)')
  console.log('   POST   /posts           创建文章')
  console.log('   PUT    /posts/:id       更新文章')
  console.log('   DELETE /posts/:id       删除文章')
  console.log('\n评论管理:')
  console.log('   GET    /posts/:id/comments      获取评论列表')
  console.log('   POST   /posts/:id/comments      添加评论')
  console.log('\n统计:')
  console.log('   GET    /stats           获取统计数据')
})
