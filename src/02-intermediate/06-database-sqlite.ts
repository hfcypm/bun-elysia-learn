/**
 * Level 2 - 进阶技能: Database Sqlite
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
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

// 数据库配置
const DB_PATH = join(process.cwd(), 'data.sqlite')

// 初始化数据库
const db = new Database(DB_PATH)

// 启用外键支持
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

console.log('💾 数据库路径:', DB_PATH)

// ==================== 数据库迁移 ====================
function runMigrations() {
  console.log('🔧 运行数据库迁移...')

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#666666'
    )
  `)

  // 文章标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)

  // 评论表
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  console.log('✅ 数据库迁移完成')
}

// 运行迁移
runMigrations()

// 插入示例数据
const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
  
  if (userCount.count === 0) {
    console.log('🌱 插入示例数据...')
    
    // 插入用户
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `)
    
    insertUser.run('admin', 'admin@example.com', 'hashed_password_123', 'admin')
    insertUser.run('user1', 'user1@example.com', 'hashed_password_456', 'user')
    insertUser.run('user2', 'user2@example.com', 'hashed_password_789', 'user')

    // 插入标签
    const insertTag = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
    insertTag.run('TypeScript', '#3178C6')
    insertTag.run('Elysia', '#F938AB')
    insertTag.run('Tutorial', '#28A745')
    insertTag.run('SQLite', '#003B57')

    // 插入文章
    const insertPost = db.prepare(`
      INSERT INTO posts (title, content, author_id, status)
      VALUES (?, ?, ?, ?)
    `)
    
    const post1 = insertPost.run('Elysia.js 入门教程', '这是一篇介绍 Elysia.js 的文章...', 1, 'published')
    const post2 = insertPost.run('SQLite 最佳实践', '学习如何高效使用 SQLite...', 1, 'published')
    const post3 = insertPost.run('TypeScript 高级技巧', '深入理解 TypeScript...', 2, 'draft')

    // 文章标签关联
    const insertPostTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)')
    insertPostTag.run(post1.lastInsertRowid, 1)
    insertPostTag.run(post1.lastInsertRowid, 2)
    insertPostTag.run(post1.lastInsertRowid, 3)
    insertPostTag.run(post2.lastInsertRowid, 4)
    insertPostTag.run(post3.lastInsertRowid, 1)
    insertPostTag.run(post3.lastInsertRowid, 3)

    console.log('✅ 示例数据插入完成')
  }
}

seedData()

// ==================== 数据模型 ====================
interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  status: string
  view_count: number
  created_at: string
  updated_at: string
}

interface Tag {
  id: number
  name: string
  color: string
}

interface Comment {
  id: number
  post_id: number
  author_id: number
  content: string
  created_at: string
}

// ==================== 预处理语句 ====================
const statements = {
  // 用户
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getAllUsers: db.prepare('SELECT id, username, email, role, created_at FROM users'),
  createUser: db.prepare(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `),
  updateUser: db.prepare(`
    UPDATE users SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),

  // 文章
  getPostById: db.prepare('SELECT * FROM posts WHERE id = ?'),
  getAllPosts: db.prepare('SELECT * FROM posts ORDER BY created_at DESC'),
  getPublishedPosts: db.prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC"),
  getPostsByAuthor: db.prepare('SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC'),
  getPostsByTag: db.prepare(`
    SELECT p.* FROM posts p
    INNER JOIN post_tags pt ON p.id = pt.post_id
    WHERE pt.tag_id = ?
    ORDER BY p.created_at DESC
  `),
  createPost: db.prepare(`
    INSERT INTO posts (title, content, author_id, status)
    VALUES (?, ?, ?, ?)
  `),
  updatePost: db.prepare(`
    UPDATE posts SET title = ?, content = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  incrementViewCount: db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?'),
  deletePost: db.prepare('DELETE FROM posts WHERE id = ?'),

  // 标签
  getAllTags: db.prepare('SELECT * FROM tags'),
  getTagById: db.prepare('SELECT * FROM tags WHERE id = ?'),
  createTag: db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)'),

  // 评论
  getCommentsByPost: db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC'),
  createComment: db.prepare('INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)')
}

// ==================== API 定义 ====================
const app = new Elysia()
  // ===== 用户相关 =====
  .group('/users', app => app
    .get('/', () => {
      const users = statements.getAllUsers.all() as User[]
      return { success: true, count: users.length, data: users }
    })

    .get('/:id', ({ params, set }) => {
      const user = statements.getUserById.get(params.id) as User | undefined
      
      if (!user) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      return { success: true, data: user }
    })

    .post('/', ({ body, set }) => {
      const { username, email, password, role = 'user' } = body

      try {
        const result = statements.createUser.run(username, email, password, role)
        
        set.status = 201
        return {
          success: true,
          message: '用户创建成功',
          data: { id: result.lastInsertRowid, username, email, role }
        }
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint')) {
          set.status = 409
          return { success: false, error: '用户名或邮箱已存在' }
        }
        throw error
      }
    })
  )

  // ===== 文章相关 =====
  .group('/posts', app => app
    .get('/', ({ query }) => {
      const { status, author_id, tag_id } = query as any

      let posts: Post[]

      if (tag_id) {
        posts = statements.getPostsByTag.all(tag_id) as Post[]
      } else if (status === 'published') {
        posts = statements.getPublishedPosts.all() as Post[]
      } else if (author_id) {
        posts = statements.getPostsByAuthor.all(author_id) as Post[]
      } else {
        posts = statements.getAllPosts.all() as Post[]
      }

      // 填充作者信息
      const postsWithAuthor = posts.map(post => {
        const author = statements.getUserById.get(post.author_id) as User
        return {
          ...post,
          author: { id: author.id, username: author.username }
        }
      })

      return { success: true, count: postsWithAuthor.length, data: postsWithAuthor }
    })

    .get('/:id', ({ params, set }) => {
      const post = statements.getPostById.get(params.id) as Post | undefined
      
      if (!post) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      // 增加阅读数
      statements.incrementViewCount.run(params.id)

      // 获取作者信息
      const author = statements.getUserById.get(post.author_id) as User

      // 获取标签
      const tags = db.prepare(`
        SELECT t.* FROM tags t
        INNER JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `).all(params.id) as Tag[]

      // 获取评论
      const comments = statements.getCommentsByPost.all(params.id) as Comment[]

      return {
        success: true,
        data: {
          ...post,
          author: { id: author.id, username: author.username },
          tags,
          comments: comments.map(c => ({
            ...c,
            author: statements.getUserById.get(c.author_id)
          }))
        }
      }
    })

    .post('/', ({ body, set }) => {
      const { title, content, author_id, status = 'draft', tag_ids = [] } = body

      // 使用事务确保数据一致性
      const transaction = db.transaction(() => {
        const result = statements.createPost.run(title, content, author_id, status)
        const postId = result.lastInsertRowid as number

        // 插入标签关联
        const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)')
        for (const tagId of tag_ids) {
          insertTag.run(postId, tagId)
        }

        return postId
      })

      try {
        const postId = transaction()
        
        set.status = 201
        return {
          success: true,
          message: '文章创建成功',
          data: { id: postId, title, status }
        }
      } catch (error: any) {
        set.status = 400
        return { success: false, error: error.message }
      }
    })

    .put('/:id', ({ params, body, set }) => {
      const { title, content, status } = body
      
      const existing = statements.getPostById.get(params.id)
      
      if (!existing) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      statements.updatePost.run(
        title ?? (existing as Post).title,
        content ?? (existing as Post).content,
        status ?? (existing as Post).status,
        params.id
      )

      return {
        success: true,
        message: '文章更新成功',
        data: { id: params.id, title, status }
      }
    })

    .delete('/:id', ({ params, set }) => {
      const existing = statements.getPostById.get(params.id)
      
      if (!existing) {
        set.status = 404
        return { success: false, error: '文章不存在' }
      }

      statements.deletePost.run(params.id)

      return { success: true, message: '文章删除成功' }
    })
  )

  // ===== 标签相关 =====
  .group('/tags', app => app
    .get('/', () => {
      const tags = statements.getAllTags.all() as Tag[]
      
      // 统计每个标签的文章数
      const tagsWithCount = tags.map(tag => {
        const count = db.prepare('SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?')
          .get(tag.id) as { count: number }
        return { ...tag, postCount: count.count }
      })

      return { success: true, count: tags.length, data: tagsWithCount }
    })

    .post('/', ({ body, set }) => {
      const { name, color = '#666666' } = body

      try {
        const result = statements.createTag.run(name, color)
        
        set.status = 201
        return {
          success: true,
          message: '标签创建成功',
          data: { id: result.lastInsertRowid, name, color }
        }
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint')) {
          set.status = 409
          return { success: false, error: '标签已存在' }
        }
        throw error
      }
    })
  )

  // ===== 评论相关 =====
  .post('/posts/:postId/comments', ({ params, body, set }) => {
    const { post_id } = params
    const { author_id, content } = body

    // 检查文章是否存在
    const post = statements.getPostById.get(post_id)
    
    if (!post) {
      set.status = 404
      return { success: false, error: '文章不存在' }
    }

    // 检查用户是否存在
    const author = statements.getUserById.get(author_id)
    
    if (!author) {
      set.status = 404
      return { success: false, error: '用户不存在' }
    }

    const result = statements.createComment.run(post_id, author_id, content)

    set.status = 201
    return {
      success: true,
      message: '评论发表成功',
      data: { id: result.lastInsertRowid, post_id, author_id, content }
    }
  })

  // ===== 数据库管理 =====
  .get('/db/stats', () => {
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
      posts: db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number },
      tags: db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number },
      comments: db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number },
      publishedPosts: db.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'").get() as { count: number }
    }

    return { success: true, data: stats }
  })

  .post('/db/reset', () => {
    // 删除所有数据
    db.exec('DELETE FROM comments')
    db.exec('DELETE FROM post_tags')
    db.exec('DELETE FROM posts')
    db.exec('DELETE FROM tags')
    db.exec('DELETE FROM users')

    // 重置自增 ID
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'posts', 'tags', 'comments')")

    // 重新插入示例数据
    seedData()

    return { success: true, message: '数据库已重置' }
  })

  .listen(3015)

console.log('🗄️ SQLite 数据库服务运行在 http://localhost:3015')
console.log('📖 测试端点:')
console.log('   === 用户 ===')
console.log('   GET /users - 获取所有用户')
console.log('   GET /users/1 - 获取用户详情')
console.log('   POST /users - 创建用户')
console.log('   === 文章 ===')
console.log('   GET /posts - 获取所有文章')
console.log('   GET /posts?status=published - 获取已发布文章')
console.log('   GET /posts?tag_id=1 - 获取指定标签的文章')
console.log('   GET /posts/1 - 获取文章详情 (含评论)')
console.log('   POST /posts - 创建文章')
console.log('   PUT /posts/1 - 更新文章')
console.log('   DELETE /posts/1 - 删除文章')
console.log('   === 标签 ===')
console.log('   GET /tags - 获取所有标签')
console.log('   POST /tags - 创建标签')
console.log('   === 评论 ===')
console.log('   POST /posts/1/comments - 发表评论')
console.log('   === 数据库管理 ===')
console.log('   GET /db/stats - 查看统计')
console.log('   POST /db/reset - 重置数据库')

export type SQLiteApp = typeof app
