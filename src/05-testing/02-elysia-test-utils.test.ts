/**
 * Elysia 测试工具
 * 
 * 学习目标:
 * - 使用 Elysia 的测试工具
 * - 测试路由和处理器
 * - 测试请求和响应
 * - 测试中间件和钩子
 * 
 * 运行测试:
 * bun test src/testing/02-elysia-test-utils.test.ts
 * 
 * 文档:
 * https://elysiajs.com/advanced/testing.html
 */

import { describe, expect, it } from 'bun:test'
import { Elysia, t } from 'elysia'

// ==================== 创建测试应用 ====================

function createTestApp() {
  return new Elysia()
    .get('/', () => 'Hello World')
    .get('/api/time', () => ({ 
      now: Date.now(),
      message: '当前时间'
    }))
    .get('/api/echo/:message', ({ params }) => ({ 
      echo: params.message 
    }))
}

// ==================== 基础路由测试 ====================

describe('基础路由测试', () => {
  const app = createTestApp()

  it('测试 GET / 响应', async () => {
    const response = await app.handle(new Request('http://localhost:3000/'))
    
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello World')
  })

  it('测试 GET /api/time 响应', async () => {
    const response = await app.handle(new Request('http://localhost:3000/api/time'))
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('now')
    expect(data).toHaveProperty('message', '当前时间')
  })

  it('测试 GET /api/echo/:message 响应', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/api/echo/hello')
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.echo).toBe('hello')
  })

  it('测试 404 响应', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/not-found')
    )
    
    expect(response.status).toBe(404)
  })
})

// ==================== POST 请求测试 ====================

describe('POST 请求测试', () => {
  const users: any[] = []
  
  const app = new Elysia()
    .post('/api/users', ({ body }) => {
      const newUser = { id: users.length + 1, ...body }
      users.push(newUser)
      return { success: true, data: newUser }
    }, {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        age: t.Optional(t.Number({ minimum: 0, maximum: 150 }))
      }),
      detail: {
        tags: ['用户'],
        summary: '创建用户'
      }
    })

  it('创建用户成功', async () => {
    const body = { name: '张三', email: 'zhangsan@example.com', age: 25 }
    const response = await app.handle(
      new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('张三')
    expect(data.data.id).toBe(1)
  })

  it('验证失败 - 邮箱格式错误', async () => {
    const body = { name: '李四', email: 'invalid-email' }
    const response = await app.handle(
      new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    )
    
    expect(response.status).toBe(422)
    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('验证失败 - 缺少必填字段', async () => {
    const body = { email: 'test@example.com' }
    const response = await app.handle(
      new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    )
    
    expect(response.status).toBe(422)
  })
})

// ==================== PUT/DELETE 请求测试 ====================

describe('PUT/DELETE 请求测试', () => {
  let users: any[] = [{ id: 1, name: '张三', age: 25 }]
  
  const app = new Elysia()
    .get('/api/users', () => users)
    .put('/api/users/:id', ({ body, params, set }) => {
      const index = users.findIndex(u => u.id === Number(params.id))
      if (index === -1) {
        set.status = 404
        return { success: false, message: '用户不存在' }
      }
      users[index] = { ...users[index], ...body }
      return { success: true, data: users[index] }
    }, {
      body: t.Object({
        name: t.Optional(t.String()),
        age: t.Optional(t.Number())
      })
    })
    .delete('/api/users/:id', ({ params, set }) => {
      const index = users.findIndex(u => u.id === Number(params.id))
      if (index === -1) {
        set.status = 404
        return { success: false, message: '用户不存在' }
      }
      users = users.filter(u => u.id !== Number(params.id))
      return { success: true, message: '删除成功' }
    })

  it('获取用户列表', async () => {
    const response = await app.handle(new Request('http://localhost:3000/api/users'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(1)
  })

  it('更新用户', async () => {
    const body = { age: 26 }
    const response = await app.handle(
      new Request('http://localhost:3000/api/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.age).toBe(26)
  })

  it('删除用户', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/api/users/1', {
        method: 'DELETE'
      })
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('删除不存在的用户返回 404', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/api/users/999', {
        method: 'DELETE'
      })
    )
    
    expect(response.status).toBe(404)
  })
})

// ==================== 中间件测试 ====================

describe('中间件测试', () => {
  const app = new Elysia()
    .derive(({ set }) => {
      set.headers['X-Powered-By'] = 'Elysia'
      return { timestamp: Date.now() }
    })
    .get('/api/protected', ({ set }) => {
      return { protected: true }
    })
    .get('/api/headers', ({ request }) => {
      const authHeader = request.headers.get('Authorization')
      return { auth: authHeader }
    })

  it('测试响应头', async () => {
    const response = await app.handle(new Request('http://localhost:3000/api/protected'))
    
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Powered-By')).toBe('Elysia')
  })

  it('测试请求头', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/api/headers', {
        headers: { 'Authorization': 'Bearer token123' }
      })
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.auth).toBe('Bearer token123')
  })
})

// ==================== 查询参数测试 ====================

describe('查询参数测试', () => {
  const app = new Elysia()
    .get('/api/products', ({ query }) => {
      const page = Number(query.page) || 1
      const limit = Number(query.limit) || 10
      const search = query.search || ''
      
      return {
        page,
        limit,
        search,
        data: Array(limit).fill(null).map((_, i) => ({
          id: (page - 1) * limit + i + 1,
          name: `Product ${i + 1}`
        }))
      }
    }, {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        search: t.Optional(t.String())
      })
    })

  it('使用默认参数', async () => {
    const response = await app.handle(new Request('http://localhost:3000/api/products'))
    const data = await response.json()
    
    expect(data.page).toBe(1)
    expect(data.limit).toBe(10)
    expect(data.search).toBe('')
  })

  it('使用自定义参数', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/api/products?page=2&limit=5&search=laptop')
    )
    const data = await response.json()
    
    expect(data.page).toBe(2)
    expect(data.limit).toBe(5)
    expect(data.search).toBe('laptop')
  })
})

console.log('✅ Elysia 测试工具示例加载成功！运行 bun test 查看结果')
