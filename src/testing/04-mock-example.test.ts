/**
 * Mock 数据示例
 * 
 * 学习目标:
 * - 使用 Mock 函数
 * - 模拟外部依赖
 * - 测试异步代码
 * - 使用 Spy 监控函数调用
 * 
 * 运行测试:
 * bun test src/testing/04-mock-example.test.ts
 */

import { describe, expect, it, mock, spyOn } from 'bun:test'

// ==================== Mock 基础示例 ====================

describe('Mock 基础', () => {
  it('创建 mock 函数', () => {
    const mockFn = mock(() => 'mocked return')
    
    expect(mockFn()).toBe('mocked return')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('mock 函数返回值', () => {
    const mockFn = mock()
      .mockReturnValueOnce('first call')
      .mockReturnValueOnce('second call')
      .mockReturnValue('default return')
    
    expect(mockFn()).toBe('first call')
    expect(mockFn()).toBe('second call')
    expect(mockFn()).toBe('default return')
  })

  it('mock 函数抛出错误', () => {
    const mockFn = mock().mockImplementation(() => {
      throw new Error('Test error')
    })
    
    expect(() => mockFn()).toThrow('Test error')
  })

  it('mock 函数实现多次', () => {
    const mockFn = mock()
      .mockImplementationOnce(() => 'first')
      .mockImplementationOnce(() => 'second')
    
    expect(mockFn()).toBe('first')
    expect(mockFn()).toBe('second')
    expect(mockFn()).toBeUndefined()
  })
})

// ==================== Mock 对象方法 ====================

describe('Mock 对象方法', () => {
  const apiService = {
    fetchUser(id: number) {
      return Promise.resolve({ id, name: '张三' })
    },
    fetchPosts(userId: number) {
      return Promise.resolve([{ id: 1, title: 'Post 1' }])
    }
  }

  it('mock 对象方法', () => {
    mock(apiService, 'fetchUser').mockResolvedValue({ id: 1, name: '李四' })
    
    expect(apiService.fetchUser(1)).resolves.toEqual({ id: 1, name: '李四' })
  })

  it('mock 返回值', () => {
    mock(apiService, 'fetchPosts').mockResolvedValue([
      { id: 1, title: 'Mocked Post' }
    ])
    
    expect(apiService.fetchPosts(1)).resolves.toEqual([
      { id: 1, title: 'Mocked Post' }
    ])
  })
})

// ==================== 使用 Spy ====================

describe('Spy 监控', () => {
  const logger = {
    log(message: string) {
      console.log(message)
    },
    error(message: string) {
      console.error(message)
    }
  }

  it('spyOn 监控函数调用', () => {
    const spy = spyOn(logger, 'log')
    
    logger.log('test message')
    
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('test message')
    
    spy.mockRestore()
  })

  it('spyOn 监控错误日志', () => {
    const spy = spyOn(logger, 'error')
    
    logger.error('error message')
    
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('error message')
    
    spy.mockRestore()
  })
})

// ==================== 模拟定时器 ====================

describe('模拟定时器', () => {
  it('使用 setTimeout', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    
    const callback = mock()
    setTimeout(callback, 1000)
    expect(callback).not.toHaveBeenCalled()
    
    await mock.timers.tick(1000)
    expect(callback).toHaveBeenCalledTimes(1)
    
    mock.timers.disable()
  })

  it('使用 setInterval', async () => {
    mock.timers.enable({ apis: ['setInterval'] })
    
    const callback = mock()
    const interval = setInterval(callback, 100)
    
    await mock.timers.tick(300)
    expect(callback).toHaveBeenCalledTimes(3)
    
    clearInterval(interval)
    mock.timers.disable()
  })
})

// ==================== 模拟 API 请求 ====================

describe('模拟 API 请求', () => {
  const mockFetch = mock()

  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  it('mock fetch 成功响应', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: '张三' }),
      status: 200
    })

    const response = await fetch('https://api.example.com/users/1')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data).toEqual({ id: 1, name: '张三' })
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/1')
  })

  it('mock fetch 失败响应', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    const response = await fetch('https://api.example.com/users/999')

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('mock fetch 网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('Network Error'))

    await expect(fetch('https://api.example.com/users/1')).rejects.toThrow('Network Error')
  })
})

// ==================== 模拟数据库操作 ====================

describe('模拟数据库操作', () => {
  const mockDatabase = {
    async query(sql: string, params: any[]) {
      return { rows: [] }
    },
    async insert(table: string, data: any) {
      return { id: 1, ...data }
    },
    async update(table: string, id: number, data: any) {
      return { id, ...data }
    },
    async delete(table: string, id: number) {
      return true
    }
  }

  beforeEach(() => {
    mock(mockDatabase, 'query').mockResolvedValue({
      rows: [{ id: 1, name: '张三' }]
    })
    mock(mockDatabase, 'insert').mockResolvedValue({ id: 1, name: '李四' })
    mock(mockDatabase, 'update').mockResolvedValue({ id: 1, name: '王五' })
    mock(mockDatabase, 'delete').mockResolvedValue(true)
  })

  it('模拟查询', async () => {
    const result = await mockDatabase.query('SELECT * FROM users WHERE id = $1', [1])
    
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('张三')
  })

  it('模拟插入', async () => {
    const result = await mockDatabase.insert('users', { name: '李四' })
    
    expect(result.id).toBe(1)
    expect(result.name).toBe('李四')
  })

  it('模拟更新', async () => {
    const result = await mockDatabase.update('users', 1, { name: '王五' })
    
    expect(result.id).toBe(1)
    expect(result.name).toBe('王五')
  })

  it('模拟删除', async () => {
    const result = await mockDatabase.delete('users', 1)
    
    expect(result).toBe(true)
  })
})

// ==================== 模拟文件系统 ====================

describe('模拟文件系统', () => {
  const mockFs = {
    async readFile(path: string) {
      return '文件内容'
    },
    async writeFile(path: string, content: string) {
      return true
    },
    async deleteFile(path: string) {
      return true
    }
  }

  it('模拟读取文件', async () => {
    mock(mockFs, 'readFile').mockResolvedValue('模拟的文件内容')
    
    const content = await mockFs.readFile('/path/to/file.txt')
    
    expect(content).toBe('模拟的文件内容')
  })

  it('模拟写入文件', async () => {
    mock(mockFs, 'writeFile').mockResolvedValue(true)
    
    const result = await mockFs.writeFile('/path/to/file.txt', '新内容')
    
    expect(result).toBe(true)
  })
})

// ==================== 完整的业务场景 Mock ====================

describe('完整的业务场景 Mock', () => {
  class UserService {
    constructor(private db: any, private emailService: any) {}

    async createUser(name: string, email: string) {
      const user = await this.db.insert('users', { name, email })
      await this.emailService.sendWelcomeEmail(email)
      return user
    }

    async deleteUser(id: number) {
      const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id])
      if (user.rows.length === 0) {
        throw new Error('用户不存在')
      }
      await this.db.delete('users', id)
      return true
    }
  }

  it('创建用户完整流程', async () => {
    const mockDb = {
      insert: mock().mockResolvedValue({ id: 1, name: '张三', email: 'test@example.com' }),
      query: mock().mockResolvedValue({ rows: [] })
    }

    const mockEmailService = {
      sendWelcomeEmail: mock().mockResolvedValue(true)
    }

    const userService = new UserService(mockDb, mockEmailService)

    const user = await userService.createUser('张三', 'test@example.com')

    expect(user).toEqual({ id: 1, name: '张三', email: 'test@example.com' })
    expect(mockDb.insert).toHaveBeenCalledWith('users', { name: '张三', email: 'test@example.com' })
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com')
  })

  it('删除不存在的用户', async () => {
    const mockDb = {
      query: mock().mockResolvedValue({ rows: [] }),
      delete: mock().mockResolvedValue(true)
    }

    const mockEmailService = {
      sendWelcomeEmail: mock().mockResolvedValue(true)
    }

    const userService = new UserService(mockDb, mockEmailService)

    await expect(userService.deleteUser(999)).rejects.toThrow('用户不存在')
  })
})

console.log('✅ Mock 示例加载成功！运行 bun test 查看结果')
