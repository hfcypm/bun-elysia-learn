/**
 * Bun 测试基础
 * 
 * 学习目标:
 * - 了解 Bun 内置的测试框架
 * - 掌握基础测试编写
 * - 理解测试断言
 * - 学会运行测试
 * 
 * 运行测试:
 * bun test src/testing/01-bun-test-basics.test.ts
 * 
 * 文档:
 * https://bun.sh/docs/runtime/writing-tests
 */

import { describe, expect, it, test } from 'bun:test'

// ==================== 基础测试 ====================

describe('基础测试示例', () => {
  // 简单的断言测试
  test('1 + 1 应该等于 2', () => {
    expect(1 + 1).toEqual(2)
  })

  test('字符串应该包含子串', () => {
    expect('Hello World').toContain('World')
  })

  test('数组应该包含元素', () => {
    expect([1, 2, 3]).toContain(2)
  })

  // 测试布尔值
  test('应该为真', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
  })

  // 测试 null 和 undefined
  test('应该为空', () => {
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect({}).toBeDefined()
  })

  // 数字比较
  test('数字比较', () => {
    expect(5).toBeGreaterThan(3)
    expect(3).toBeLessThan(5)
    expect(5).toBeGreaterThanOrEqual(5)
    expect(5).toBeLessThanOrEqual(5)
  })

  // 浮点数测试
  test('浮点数精度', () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5)
  })
})

// ==================== 对象和数组测试 ====================

describe('对象和数组测试', () => {
  test('对象属性匹配', () => {
    const user = { name: '张三', age: 25, city: '北京' }
    
    expect(user).toHaveProperty('name')
    expect(user).toHaveProperty('age', 25)
    expect(user).toHaveProperty('city', '北京')
  })

  test('对象部分匹配', () => {
    const user = { name: '张三', age: 25, city: '北京' }
    
    expect(user).toMatchObject({ name: '张三', age: 25 })
  })

  test('数组长度', () => {
    const arr = [1, 2, 3, 4, 5]
    
    expect(arr).toHaveLength(5)
  })

  test('数组内容匹配', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3])
    expect([{ id: 1 }, { id: 2 }]).toEqual([{ id: 1 }, { id: 2 }])
  })
})

// ==================== 函数测试 ====================

describe('函数测试', () => {
  // 被测试的函数
  function add(a: number, b: number): number {
    return a + b
  }

  function divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('除数不能为零')
    }
    return a / b
  }

  function asyncFetch(): Promise<string> {
    return Promise.resolve('数据加载成功')
  }

  test('加法函数', () => {
    expect(add(1, 2)).toBe(3)
    expect(add(-1, 1)).toBe(0)
    expect(add(0.1, 0.2)).toBeCloseTo(0.3)
  })

  test('除法函数正常情况', () => {
    expect(divide(10, 2)).toBe(5)
  })

  test('除法函数抛出错误', () => {
    expect(() => divide(10, 0)).toThrow('除数不能为零')
  })

  test('异步函数', async () => {
    const result = await asyncFetch()
    expect(result).toBe('数据加载成功')
  })
})

// ==================== 常用断言方法 ====================

describe('常用断言方法', () => {
  test('等于 (严格相等)', () => {
    expect(1).toBe(1)
    expect('hello').toBe('hello')
  })

  test('相等 (宽松相等)', () => {
    expect(1).toEqual(1)
    expect({ a: 1 }).toEqual({ a: 1 })
  })

  test('布尔值断言', () => {
    expect(true).toBe(true)
    expect(false).toBe(false)
  })

  test('空值断言', () => {
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect(0).not.toBeNull()
    expect('').not.toBeNull()
  })

  test('包含关系', () => {
    expect('Hello World').toContain('World')
    expect([1, 2, 3]).toContain(2)
  })

  test('匹配正则表达式', () => {
    expect('user123@email.com').toMatch(/^[\w-]+@([\w-]+\.)+[a-zA-Z]{2,}$/)
  })

  test('大于小于', () => {
    expect(10).toBeGreaterThan(5)
    expect(5).toBeLessThan(10)
  })
})

// ==================== 否定断言 ====================

describe('否定断言 (not)', () => {
  test('不等于', () => {
    expect(1).not.toBe(2)
  })

  test('不包含', () => {
    expect('Hello').not.toContain('World')
  })

  test('不为 null', () => {
    expect({}).not.toBeNull()
  })

  test('不为真', () => {
    expect(false).not.toBeTruthy()
  })
})

// ==================== 测试跳过和仅运行 ====================

describe('测试控制', () => {
  // 仅运行这个测试
  test.only('这个测试会被单独运行', () => {
    expect('only').toBe('only')
  })

  // 跳过这个测试
  test.skip('这个测试会被跳过', () => {
    expect('skip').toBe('skip')
  })

  // 正常测试
  test('这个测试会正常运行', () => {
    expect('normal').toBe('normal')
  })

  // 失败时运行一次后重试
  test('重试测试', () => {
    expect(1).toBe(1)
  })
})

console.log('✅ 测试文件加载成功！运行 bun test 查看结果')
