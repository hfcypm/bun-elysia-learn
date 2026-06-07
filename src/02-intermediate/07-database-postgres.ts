/**
 * Level 2 - 进阶技能: Database Postgres
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 掌握请求验证（TypeBox）
 * 2. ✅ 理解中间件的工作原理
 * 3. ✅ 实现文件上传功能
 * 4. ✅ 掌握数据库 CRUD 操作
 * 5. ✅ 使用 Prisma ORM
 * 
 * ⚠️ 注意事项：
 * - 验证失败会返回 400 状态码
 * - 中间件按顺序执行
 * - 文件上传注意大小限制
 * - 数据库连接需要正确配置
 * - Prisma 需要先 generate
 * 
 * 📝 练习任务：
 * - 添加更多验证规则
 * - 实现自定义中间件
 * - 扩展数据库模型
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'
import postgres from 'postgres'

// 数据库配置
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/elysia_db'

// 创建连接池
const sql = postgres(DATABASE_URL, {
  // 最大连接数
  max: 10,
  // 空闲超时 (毫秒)
  idle_timeout: 30,
  // 连接超时 (毫秒)
  connect_timeout: 10,
  // 准备语句
  prepare: true
})

console.log('💾 数据库连接:', DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@'))

// ==================== 初始化数据库 ====================
async function runMigrations() {
  console.log('🔧 运行数据库迁移...')

  try {
    // 用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // 文章表
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // 标签表
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(7) DEFAULT '#666666'
      )
    `

    // 文章标签关联表
    await sql`
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      )
    `

    // 评论表
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log('✅ 数据库迁移完成')

    // 检查是否需要插入示例数据
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    
    if (userCount[0].count === 0) {
      console.log('🌱 插入示例数据...')

      // 使用事务插入数据
      await sql.begin(async (sql) => {
        // 插入用户
        const users = await sql`
          INSERT INTO users (username, email, password_hash, role)
          VALUES 
            ('admin', 'admin@example.com', 'hashed_password_123', 'admin'),
            ('user1', 'user1@example.com', 'hashed_password_456', 'user'),
            ('user2', 'user2@example.com', 'hashed_password_789', 'user')
          RETURNING *
        `

        // 插入标签
        const tags = await sql`
          INSERT INTO tags (name, color)
          VALUES 
            ('TypeScript', '#3178C6'),
            ('Elysia', '#F938AB'),
            ('Tutorial', '#28A745'),
            ('PostgreSQL', '#336791')
          RETURNING *
        `

        // 插入文章
        const posts = await sql`
          INSERT INTO posts (title, content, author_id, status)
          VALUES 
            ('Elysia.js 入门教程', '这是一篇介绍 Elysia.js 的文章...', 1, 'published'),
            ('PostgreSQL 最佳实践', '学习如何高效使用 PostgreSQL...', 1, 'published'),
            ('TypeScript 高级技巧', '深入理解 TypeScript...', 2, 'draft')
          RETURNING *
        `

        // 插入标签关联
        await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${posts[0].id}, ${tags[0].id})`
        await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${posts[0].id}, ${tags[1].id})`
        await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${posts[0].id}, ${tags[2].id})`
        await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${posts[1].id}, ${tags[3].id})`
        await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${posts[2].id}, ${tags[0].id})`

        console.log('✅ 示例数据插入完成')
      })
    }
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error)
    console.error('请确保 PostgreSQL 服务已启动，并且数据库已创建')
    process.exit(1)
  }
}

// 运行迁移
runMigrations()

// ==================== API 定义 ====================
const app = new Elysia()
  // ===== 健康检查 =====
  .get('/db/health', async () => {
    try {
      const result = await sql`SELECT 1 as status`
      return {
        success: true,
        status: 'healthy',
        database: 'PostgreSQL',
        response_time: 'fast'
      }
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // ===== 用户相关 =====
  .group('/users', app => app
    .get('/', async () => {
      const users = await sql`
        SELECT id, username, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `
      
      return { success: true, count: users.length, data: users }
    })

    .get('/:id', async ({ params, set }) => {
      const users = await sql`
        SELECT id, username, email, role, created_at 
        FROM users 
        WHERE id = ${params.id}
      `
      
      if (users.length === 0) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      return { success: true, data: users[0] }
    })

    .post('/', async ({ body, set }) => {
      const { username, email, password, role = 'user' } = body

      try {
        const users = await sql`
          INSERT INTO users (username, email, password_hash, role)
          VALUES (${username}, ${email}, ${password}, ${role})
          RETURNING id, username, email, role, created_at
        `
        
        set.status = 201
        return {
          success: true,
          message: '用户创建成功',
          data: users[0]
        }
      } catch (error: any) {
        if (error.code === '23505') { // 唯一约束冲突
          set.status = 409
          return { success: false, error: '用户名或邮箱已存在' }
        }
        throw error
      }
    })

    .put('/:id', async ({ params, body, set }) => {
      const { username, email, role } = body

      // 先检查用户是否存在
      const existing = await sql`SELECT * FROM users WHERE id = ${params.id}`
      
      if (existing.length === 0) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      try {
        const users = await sql`
          UPDATE users 
          SET username = ${username ?? existing[0].username},
              email = ${email ?? existing[0].email},
              role = ${role ?? existing[0].role},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${params.id}
          RETURNING id, username, email, role, created_at
        `
        
        return { success: true, data: users[0] }
      } catch (error: any) {
        if (error.code === '23505') {
          set.status = 409
          return { success: false, error: '用户名或邮箱已存在' }
        }
        throw error
      }
    })

    .delete('/:id', async ({ params, set }) => {
      const existing = await sql`SELECT * FROM users WHERE id = ${params.id}`
      
      if (existing.length === 0) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      await sql`DELETE FROM users WHERE id = ${params.id}`

      return { success: true, message: '用户删除成功' }
    })
  )

  // ===== 文章相关 =====
  .group('/posts', app => app
    .get('/', async ({ query }) => {
      const { status, author_id, tag_id, limit = 20, offset = 0 } = query as any

      let posts: any[]

      if (tag_id) {
        // 带标签过滤
        posts = await sql`
          SELECT p.*, u.username as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN post_tags pt ON p.id = pt.post_id
          WHERE pt.tag_id = ${tag_id}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (status === 'published') {
        // 只获取已发布
        posts = await sql`
          SELECT p.*, u.username as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (author_id) {
        // 按作者筛选
        posts = await sql`
          SELECT p.*, u.username as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.author_id = ${author_id}
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        // 获取所有
        posts = await sql`
          SELECT p.*, u.username as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }

      // 获取每篇文章的标签
      const postsWithTags = await Promise.all(
        posts.map(async (post) => {
          const tags = await sql`
            SELECT t.* FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = ${post.id}
          `
          return { ...post, tags }
        })
      )

      return { 
        success: true, 
        count: postsWithTags.length, 
        data: postsWithTags 
      }
    })

    .get('/:id', async ({ params, set }) => {
      const posts = await sql`
        SELECT p.*, u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ${params.id}
      `
      
      if (posts.length === 0) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      // 增加阅读数 (异步，不阻塞响应)
      sql`UPDATE posts SET view_count = view_count + 1 WHERE id = ${params.id}`.catch(console.error)

      const post = posts[0]

      // 获取标签
      const tags = await sql`
        SELECT t.* FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ${params.id}
      `

      // 获取评论
      const comments = await sql`
        SELECT c.*, u.username as author_name
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ${params.id}
        ORDER BY c.created_at DESC
      `

      return {
        success: true,
        data: { ...post, tags, comments }
      }
    })

    .post('/', async ({ body, set }) => {
      const { title, content, author_id, status = 'draft', tag_ids = [] } = body

      // 使用事务
      try {
        const result = await sql.begin(async (sql) => {
          // 创建文章
          const posts = await sql`
            INSERT INTO posts (title, content, author_id, status)
            VALUES (${title}, ${content}, ${author_id}, ${status})
            RETURNING *
          `

          const post = posts[0]

          // 插入标签关联
          if (tag_ids.length > 0) {
            await sql`
              INSERT INTO post_tags (post_id, tag_id)
              ${sql(tag_ids.map(tagId => ({ post_id: post.id, tag_id: tagId })))}
            `
          }

          return post
        })

        set.status = 201
        return {
          success: true,
          message: '文章创建成功',
          data: result
        }
      } catch (error: any) {
        set.status = 400
        return { success: false, error: error.message }
      }
    })

    .put('/:id', async ({ params, body, set }) => {
      const { title, content, status } = body

      const existing = await sql`SELECT * FROM posts WHERE id = ${params.id}`
      
      if (existing.length === 0) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      const post = existing[0]

      const posts = await sql`
        UPDATE posts 
        SET title = ${title ?? post.title},
            content = ${content ?? post.content},
            status = ${status ?? post.status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.id}
        RETURNING *
      `

      return { success: true, data: posts[0] }
    })

    .delete('/:id', async ({ params, set }) => {
      const existing = await sql`SELECT * FROM posts WHERE id = ${params.id}`
      
      if (existing.length === 0) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      await sql`DELETE FROM posts WHERE id = ${params.id}`

      return { success: true, message: '文章删除成功' }
    })
  )

  // ===== 标签相关 =====
  .group('/tags', app => app
    .get('/', async () => {
      const tags = await sql`
        SELECT t.*, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        GROUP BY t.id
        ORDER BY post_count DESC
      `
      
      return { success: true, count: tags.length, data: tags }
    })

    .post('/', async ({ body, set }) => {
      const { name, color = '#666666' } = body

      try {
        const tags = await sql`
          INSERT INTO tags (name, color)
          VALUES (${name}, ${color})
          RETURNING *
        `
        
        set.status = 201
        return {
          success: true,
          message: '标签创建成功',
          data: tags[0]
        }
      } catch (error: any) {
        if (error.code === '23505') {
          set.status = 409
          return { success: false, error: '标签已存在' }
        }
        throw error
      }
    })
  )

  // ===== 评论相关 =====
  .post('/posts/:postId/comments', async ({ params, body, set }) => {
    const { postId } = params
    const { author_id, content } = body

    // 使用事务检查并创建
    try {
      const comments = await sql.begin(async (sql) => {
        // 检查文章
        const posts = await sql`SELECT * FROM posts WHERE id = ${postId}`
        if (posts.length === 0) {
          throw new Error('文章不存在')
        }

        // 检查用户
        const users = await sql`SELECT * FROM users WHERE id = ${author_id}`
        if (users.length === 0) {
          throw new Error('用户不存在')
        }

        // 创建评论
        return await sql`
          INSERT INTO comments (post_id, author_id, content)
          VALUES (${postId}, ${author_id}, ${content})
          RETURNING *
        `
      })

      set.status = 201
      return {
        success: true,
        message: '评论发表成功',
        data: comments[0]
      }
    } catch (error: any) {
      set.status = 400
      return { success: false, error: error.message }
    }
  })

  // ===== 数据库统计 =====
  .get('/db/stats', async () => {
    const [users, posts, tags, comments, publishedPosts] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM posts`,
      sql`SELECT COUNT(*) as count FROM tags`,
      sql`SELECT COUNT(*) as count FROM comments`,
      sql`SELECT COUNT(*) as count FROM posts WHERE status = 'published'`
    ])

    return {
      success: true,
      data: {
        users: users[0].count,
        posts: posts[0].count,
        tags: tags[0].count,
        comments: comments[0].count,
        publishedPosts: publishedPosts[0].count
      }
    }
  })

  .listen(3016)

console.log('🐘 PostgreSQL 数据库服务运行在 http://localhost:3016')
console.log('📖 测试端点:')
console.log('   GET  /db/health - 数据库健康检查')
console.log('   GET  /users - 获取所有用户')
console.log('   GET  /posts - 获取所有文章')
console.log('   GET  /posts?status=published - 获取已发布文章')
console.log('   GET  /tags - 获取所有标签')
console.log('   GET  /db/stats - 查看统计')
console.log('')
console.log('💡 请确保 PostgreSQL 服务已启动，并设置正确的 DATABASE_URL 环境变量')

export type PostgreSQLApp = typeof app
