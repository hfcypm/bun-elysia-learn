/**
 * 单元测试示例
 * 
 * 学习目标:
 * - 使用 Bun.test 编写单元测试
 * - Mock 和 Spy
 * - 集成测试
 * - 测试覆盖率
 * 
 * 运行测试:
 * bun test
 * 
 * 查看覆盖率:
 * bun test --coverage
 */

import { expect, it, describe, mock, beforeEach } from 'bun:test'
import { Elysia, t } from 'elysia'

// ==================== 被测试的代码 ====================

// 简单的数学函数
export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}

// 异步函数
export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url)
  return response.json()
}

// 带验证的函数
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 创建测试应用
function createTestApp() {
  return new Elysia()
    .get('/add', ({ query }) => {
      const a = Number(query.a)
      const b = Number(query.b)
      return { result: add(a, b) }
    })
    .get('/validate', ({ query }) => {
      const email = query.email || ''
      return { 
        email, 
        valid: validateEmail(email as string) 
      }
    })
    .post('/users', ({ body }) => {
      return {
        success: true,
        data: body
      }
    }, {
      body: t.Object({
        username: t.String(),
        email: t.String()
      })
    })
}

// ==================== 单元测试 ====================

describe('数学函数', () => {
  describe('add', () => {
    it('应该正确计算两数之和', () => {
      expect(add(1, 2)).toBe(3)
      expect(add(0, 0)).toBe(0)
      expect(add(-1, 1)).toBe(0)
      expect(add(100, 200)).toBe(300)
    })

    it('应该处理浮点数', () => {
      expect(add(1.5, 2.5)).toBe(4)
    })
  })

  describe('multiply', () => {
    it('应该正确计算两数之积', () => {
      expect(multiply(3, 4)).toBe(12)
      expect(multiply(0, 100)).toBe(0)
      expect(multiply(-2, 3)).toBe(-6)
    })
  })
})

describe('validateEmail', () => {
  const validEmails = [
    'test@example.com',
    'user.name@domain.org',
    'user+tag@example.co.uk'
  ]

  const invalidEmails = [
    'invalid',
    '@example.com',
    'user@',
    'user@domain',
    ''
  ]

  it('应该验证有效邮箱', () => {
    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true)
    })
  })

  it('应该拒绝无效邮箱', () => {
    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false)
    })
  })
})

// ==================== HTTP 测试 ====================

describe('HTTP 端点测试', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    app = createTestApp()
  })

  describe('GET /add', () => {
    it('应该返回正确的和', async () => {
      const response = await app.handle(
        new Request('http://localhost/add?a=5&b=3')
      )
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toEqual({ result: 8 })
    })

    it('应该处理负数', async () => {
      const response = await app.handle(
        new Request('http://localhost/add?a=-5&b=3')
      )
      
      const data = await response.json()
      expect(data.result).toBe(-2)
    })
  })

  describe('GET /validate', () => {
    it('应该验证有效邮箱', async () => {
      const response = await app.handle(
        new Request('http://localhost/validate?email=test@example.com')
      )
      
      const data = await response.json()
      expect(data).toEqual({
        email: 'test@example.com',
        valid: true
      })
    })

    it('应该拒绝无效邮箱', async () => {
      const response = await app.handle(
        new Request('http://localhost/validate?email=invalid')
      )
      
      const data = await response.json()
      expect(data.valid).toBe(false)
    })
  })

  describe('POST /users', () => {
    it('应该创建用户', async () => {
      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com'
          })
        })
      )
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        username: 'testuser',
        email: 'test@example.com'
      })
    })

    it('应该拒绝无效数据', async () => {
      const response = await app.handle(
        new Request('http://localhost/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser'
            // 缺少 email
          })
        })
      )
      
      expect(response.status).toBe(400)
    })
  })
})

// ==================== Mock 测试 ====================

describe('Mock 测试', () => {
  it('应该 mock 函数调用', () => {
    const mockFn = mock(() => 'mocked value')
    
    const result = mockFn()
    
    expect(result).toBe('mocked value')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith()
  })

  it('应该 spy 函数调用', () => {
    const obj = {
      method: () => 'original'
    }
    
    const spy = mock.method(obj, 'method', () => 'mocked')
    
    const result = obj.method()
    
    expect(result).toBe('mocked')
    expect(spy).toHaveBeenCalledTimes(1)
    
    // 恢复原始方法
    spy.restore()
    expect(obj.method()).toBe('original')
  })

  it('应该 mock fetch', async () => {
    // 保存原始 fetch
    const originalFetch = global.fetch
    
    // Mock fetch
    global.fetch = mock(async (url: string) => {
      return new Response(JSON.stringify({
        url,
        mocked: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }) as any

    // 测试
    const response = await fetch('https://api.example.com/data')
    const data = await response.json()
    
    expect(data).toEqual({
      url: 'https://api.example.com/data',
      mocked: true
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // 恢复原始 fetch
    global.fetch = originalFetch
  })
})

// ==================== 异步测试 ====================

describe('异步测试', () => {
  it('应该处理异步函数', async () => {
    const result = await Promise.resolve('async result')
    expect(result).toBe('async result')
  })

  it('应该处理超时', async () => {
    const start = Date.now()
    await new Promise(resolve => setTimeout(resolve, 100))
    const duration = Date.now() - start
    
    expect(duration).toBeGreaterThanOrEqual(100)
  })

  it('应该捕获异步错误', async () => {
    await expect(async () => {
      throw new Error('async error')
    }).toThrow()
  })
})

// ==================== 边界情况测试 ====================

describe('边界情况测试', () => {
  it('应该处理空输入', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('应该处理 null 和 undefined', () => {
    expect(() => add(null as any, 1)).toThrow()
    expect(() => add(undefined as any, 1)).toThrow()
  })

  it('应该处理极大数值', () => {
    expect(add(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1)
  })
})

// ==================== 测试套件组织 ====================

describe('完整业务流程', () => {
  describe('用户注册流程', () => {
    it('步骤 1: 验证邮箱格式', () => {
      expect(validateEmail('newuser@example.com')).toBe(true)
    })

    it('步骤 2: 创建用户数据', () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com'
      }
      expect(userData.username).toBe('newuser')
    })

    it('步骤 3: 计算用户 ID', () => {
      const userId = add(100, 1)
      expect(userId).toBe(101)
    })
  })
})

// ==================== 运行指令 ====================
/*
测试命令:

# 运行所有测试
bun test

# 运行指定文件测试
bun test src/practice/test-basics.test.ts

# 运行匹配的测试
bun test --test-name-pattern="Mock 测试"

# 查看覆盖率
bun test --coverage

# 监听模式
bun test --watch

# 详细输出
bun test --verbose
*/

console.log('✅ 单元测试文件已创建')
console.log('📖 运行测试:')
console.log('   bun test src/practice/test-basics.test.ts')
console.log('   bun test --coverage  # 查看覆盖率')

export {}
