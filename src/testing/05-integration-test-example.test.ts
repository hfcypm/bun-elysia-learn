/**
 * 集成测试示例
 * 
 * 学习目标:
 * - 测试完整的 API 流程
 * - 测试多个组件的交互
 * - 测试数据库操作
 * - 端到端测试示例
 * 
 * 运行测试:
 * bun test src/testing/05-integration-test-example.test.ts
 * 
 * 注意:
 * 这个测试使用内存数据库，实际项目中应使用测试数据库
 */

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { Elysia, t } from 'elysia'

// 内存数据库模拟
class InMemoryDB {
  private store: Map<string, any[]> = new Map()

  async find(table: string) {
    return this.store.get(table) || []
  }

  async findOne(table: string, id: number) {
    const items = await this.find(table)
    return items.find(item => item.id === id)
  }

  async insert(table: string, data: any) {
    const items = await this.find(table)
    const newItem = {
      id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
      ...data
    }
    this.store.set(table, [...items, newItem])
    return newItem
  }

  async update(table: string, id: number, data: any) {
    const items = await this.find(table)
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return null
    items[index] = { ...items[index], ...data }
    this.store.set(table, items)
    return items[index]
  }

  async delete(table: string, id: number) {
    const items = await this.find(table)
    const filtered = items.filter(item => item.id !== id)
    if (filtered.length === items.length) return null
    this.store.set(table, filtered)
    return true
  }

  clear() {
    this.store.clear()
  }
}

// ==================== 用户管理 API 集成测试 ====================

describe('用户管理 API 集成测试', () => {
  let app: Elysia<any, any>
  let db: InMemoryDB

  beforeEach(() => {
    db = new InMemoryDB()
    
    app = new Elysia()
      .state('db', db)
      // 获取所有用户
      .get('/api/users', async ({ store }) => {
        const users = await store.db.find('users')
        return { success: true, data: users }
      })
      // 获取单个用户
      .get('/api/users/:id', async ({ store, params, set }) => {
        const user = await store.db.findOne('users', Number(params.id))
        if (!user) {
          set.status = 404
          return { success: false, message: '用户不存在' }
        }
        return { success: true, data: user }
      })
      // 创建用户
      .post('/api/users', async ({ store, body }) => {
        const user = await store.db.insert('users', body)
        return { success: true, data: user }
      }, {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          email: t.String({ format: 'email' }),
          age: t.Optional(t.Number({ minimum: 0, maximum: 150 }))
        })
      })
      // 更新用户
      .put('/api/users/:id', async ({ store, params, body, set }) => {
        const user = await store.db.update('users', Number(params.id), body)
        if (!user) {
          set.status = 404
          return { success: false, message: '用户不存在' }
        }
        return { success: true, data: user }
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String({ format: 'email' })),
          age: t.Optional(t.Number())
        })
      })
      // 删除用户
      .delete('/api/users/:id', async ({ store, params, set }) => {
        const deleted = await store.db.delete('users', Number(params.id))
        if (!deleted) {
          set.status = 404
          return { success: false, message: '用户不存在' }
        }
        return { success: true, message: '删除成功' }
      })
  })

  afterEach(() => {
    db.clear()
  })

  it('完整用户管理流程', async () => {
    // 1. 创建用户
    const createRes = await app.handle(
      new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '张三',
          email: 'zhangsan@example.com',
          age: 25
        })
      })
    )
    expect(createRes.status).toBe(200)
    const createUser = await createRes.json()
    expect(createUser.success).toBe(true)
    expect(createUser.data.name).toBe('张三')

    // 2. 获取用户列表
    const listRes = await app.handle(new Request('http://localhost:3000/api/users'))
    expect(listRes.status).toBe(200)
    const listData = await listRes.json()
    expect(listData.success).toBe(true)
    expect(listData.data).toHaveLength(1)

    // 3. 获取单个用户
    const getRes = await app.handle(
      new Request(`http://localhost:3000/api/users/${createUser.data.id}`)
    )
    expect(getRes.status).toBe(200)
    const getData = await getRes.json()
    expect(getData.data.name).toBe('张三')

    // 4. 更新用户
    const updateRes = await app.handle(
      new Request(`http://localhost:3000/api/users/${createUser.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: 26 })
      })
    )
    expect(updateRes.status).toBe(200)
    const updateData = await updateRes.json()
    expect(updateData.data.age).toBe(26)

    // 5. 删除用户
    const deleteRes = await app.handle(
      new Request(`http://localhost:3000/api/users/${createUser.data.id}`, {
        method: 'DELETE'
      })
    )
    expect(deleteRes.status).toBe(200)
    const deleteData = await deleteRes.json()
    expect(deleteData.success).toBe(true)

    // 6. 验证已删除
    const getAfterDelete = await app.handle(
      new Request(`http://localhost:3000/api/users/${createUser.data.id}`)
    )
    expect(getAfterDelete.status).toBe(404)
  })
})

// ==================== 博客系统 API 集成测试 ====================

describe('博客系统 API 集成测试', () => {
  let app: Elysia<any, any>
  let db: InMemoryDB

  beforeEach(() => {
    db = new InMemoryDB()
    
    // 初始化分类数据
    db.store.set('categories', [
      { id: 1, name: '技术' },
      { id: 2, name: '生活' }
    ])
    
    app = new Elysia()
      .state('db', db)
      // 获取文章列表
      .get('/api/posts', async ({ store, query }) => {
        const posts = await store.db.find('posts')
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 10
        const start = (page - 1) * limit
        const end = start + limit
        return {
          success: true,
          data: posts.slice(start, end),
          total: posts.length,
          page,
          limit
        }
      })
      // 创建文章
      .post('/api/posts', async ({ store, body }) => {
        const post = await store.db.insert('posts', {
          ...body,
          createdAt: new Date().toISOString()
        })
        return { success: true, data: post }
      }, {
        body: t.Object({
          title: t.String({ minLength: 1 }),
          content: t.String({ minLength: 1 }),
          categoryId: t.Number(),
          tags: t.Optional(t.Array(t.String()))
        })
      })
      // 获取分类列表
      .get('/api/categories', async ({ store }) => {
        const categories = await store.db.find('categories')
        return { success: true, data: categories }
      })
  })

  afterEach(() => {
    db.clear()
  })

  it('博客文章 CRUD 流程', async () => {
    // 1. 获取分类
    const categoriesRes = await app.handle(new Request('http://localhost:3000/api/categories'))
    const categories = await categoriesRes.json()
    expect(categories.success).toBe(true)

    // 2. 创建文章
    const createRes = await app.handle(
      new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '我的第一篇文章',
          content: '这是文章内容...',
          categoryId: 1,
          tags: ['Elysia', 'TypeScript']
        })
      })
    )
    expect(createRes.status).toBe(200)
    const post = await createRes.json()
    expect(post.data.title).toBe('我的第一篇文章')

    // 3. 获取文章列表
    const listRes = await app.handle(new Request('http://localhost:3000/api/posts'))
    const listData = await listRes.json()
    expect(listData.total).toBe(1)
  })

  it('分页查询', async () => {
    const post1 = await db.insert('posts', { title: '文章 1', content: '内容 1', categoryId: 1 })
    await db.insert('posts', { title: '文章 2', content: '内容 2', categoryId: 1 })
    await db.insert('posts', { title: '文章 3', content: '内容 3', categoryId: 1 })

    const res = await app.handle(new Request('http://localhost:3000/api/posts?page=1&limit=2'))
    const data = await res.json()
    
    expect(data.total).toBe(4)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(2)
    expect(data.data).toHaveLength(2)
  })
})

// ==================== 身份认证集成测试 ====================

describe('身份认证集成测试', () => {
  let app: Elysia<any, any>

  const users: any[] = [
    { id: 1, username: 'admin', password: 'hashed_password_123', role: 'admin' }
  ]

  beforeEach(() => {
    app = new Elysia()
      .state('users', users)
      // 登录
      .post('/api/auth/login', async ({ body, set, store }) => {
        const user = store.users.find(
          u => u.username === body.username && u.password === body.password
        )
        if (!user) {
          set.status = 401
          return { success: false, message: '用户名或密码错误' }
        }
        return {
          success: true,
          data: {
            token: 'mock_jwt_token_123',
            user: { id: user.id, username: user.username, role: user.role }
          }
        }
      }, {
        body: t.Object({
          username: t.String(),
          password: t.String()
        })
      })
      // 获取当前用户
      .get('/api/auth/me', ({ request, set, store }) => {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          set.status = 401
          return { success: false, message: '未授权' }
        }
        const userId = 1
        const user = store.users.find(u => u.id === userId)
        return { success: true, data: user }
      })
  })

  it('登录流程', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'hashed_password_123'
        })
      })
    )
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.token).toBe('mock_jwt_token_123')
  })

  it('登录失败', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrong_password'
        })
      })
    )
    
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })

  it('获取当前用户 (已认证)', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': 'Bearer mock_jwt_token_123' }
      })
    )
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('获取当前用户 (未认证)', async () => {
    const res = await app.handle(new Request('http://localhost:3000/api/auth/me'))
    
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })
})

console.log('✅ 集成测试示例加载成功！运行 bun test 查看结果')
