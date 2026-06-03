# Elysia.js 测试指南

> 测试最佳实践和完整流程

---

## 🧪 目录

1. [为什么测试](#为什么测试)
2. [测试类型](#测试类型)
3. [Bun 测试框架](#bun-测试框架)
4. [Elysia 测试工具](#elysia-测试工具)
5. [编写单元测试](#编写单元测试)
6. [集成测试](#集成测试)
7. [Mock 技术](#mock-技术)
8. [测试覆盖率](#测试覆盖率)
9. [持续集成](#持续集成)
10. [测试最佳实践](#测试最佳实践)

---

## 为什么测试

### 测试的价值

- ✅ 发现 bug 更早
- ✅ 重构更安全
- ✅ 文档即代码
- ✅ 提升代码质量
- ✅ 减少回归问题

### 测试成本 vs 收益

```
投入 1 小时写测试
↓
节省 3 小时调试
节省 5 小时修复
节省 10 小时维护
```

---

## 测试类型

### 测试金字塔

```
        /\
       /  \
      / E2E \        少量测试
     /______\       (端到端)
    /        \
   /  集成    \       中等数量测试
  /  测试      \
 /____________\
/    单元测试    \   大量测试
/_______________\
```

### 各类型说明

| 类型 | 测试内容 | 速度 | 维护成本 | 覆盖率 |
|------|----------|------|----------|--------|
| **单元测试** | 单个函数/类 | ⚡⚡⚡ | 💰 | 📍 |
| **集成测试** | 模块间交互 | ⚡⚡ | 💰💰 | 📍📍 |
| **E2E 测试** | 完整流程 | ⚡ | 💰💰💰 | 📍📍📍 |

---

## Bun 测试框架

### 安装

```bash
# Bun 内置测试框架，无需安装
bun test
```

### 基础语法

```typescript
import { describe, expect, it, test, beforeEach, afterEach } from 'bun:test'

describe('测试套件', () => {
  beforeEach(() => {
    // 每个测试前的准备工作
  })
  
  afterEach(() => {
    // 每个测试后的清理工作
  })
  
  it('应该是这样', () => {
    expect(1 + 1).toBe(2)
  })
  
  test('另一种写法', () => {
    expect('hello').toContain('ell')
  })
})
```

### 常用断言

```typescript
// 相等性
expect(1).toBe(1)
expect({ a: 1 }).toEqual({ a: 1 })

// 布尔值
expect(true).toBe(true)
expect(false).toBeFalsy()
expect(1).toBeTruthy()

// 字符串
expect('hello world').toContain('hello')
expect('abc').toMatch(/abc/)

// 数组
expect([1, 2, 3]).toContain(2)
expect([1, 2, 3]).toHaveLength(3)

// 对象
expect({ a: 1, b: 2 }).toHaveProperty('a')
expect({ a: 1, b: 2 }).toHaveProperty('a', 1)
expect({ a: 1, b: 2 }).toMatchObject({ a: 1 })

// 错误
expect(() => throw new Error()).toThrow()
expect(() => throw new Error('test')).toThrow('test')

// 数值
expect(5).toBeGreaterThan(3)
expect(3).toBeLessThan(5)
expect(5).toBeGreaterThanOrEqual(5)
expect(5).toBeLessThanOrEqual(5)

// 浮点数
expect(0.1 + 0.2).toBeCloseTo(0.3, 5)
```

---

## Elysia 测试工具

### 测试应用

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello World')
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .post('/users', ({ body }) => ({ user: body }))

// 测试
const response = await app.handle(new Request('http://localhost/'))
const status = response.status
const text = await response.text()
```

### 完整测试示例

```typescript
import { describe, expect, it } from 'bun:test'
import { Elysia, t } from 'elysia'

describe('用户 API 测试', () => {
  const app = new Elysia()
    .get('/api/users', () => [{ id: 1, name: '张三' }])
    .get('/api/users/:id', ({ params }) => ({ id: Number(params.id), name: '张三' }))
    .post('/api/users', ({ body }) => ({ success: true, data: body }), {
      body: t.Object({
        name: t.String({ minLength: 1 })
      })
    })

  it('获取用户列表', async () => {
    const res = await app.handle(new Request('http://localhost/api/users'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('获取单个用户', async () => {
    const res = await app.handle(new Request('http://localhost/api/users/1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(1)
  })

  it('创建用户成功', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '李四' })
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('验证失败', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' })
      })
    )
    expect(res.status).toBe(422)
  })
})
```

---

## 编写单元测试

### 基础示例

```typescript
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

// 单元测试
import { describe, expect, it } from 'bun:test'

describe('数学函数测试', () => {
  describe('add', () => {
    it('1 + 1 = 2', () => {
      expect(add(1, 1)).toBe(2)
    })
    
    it('处理负数', () => {
      expect(add(-1, -1)).toBe(-2)
    })
    
    it('处理小数', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3, 5)
    })
  })
  
  describe('divide', () => {
    it('正常除法', () => {
      expect(divide(10, 2)).toBe(5)
    })
    
    it('除数为零抛出错误', () => {
      expect(() => divide(10, 0)).toThrow('除数不能为零')
    })
  })
})
```

### 复杂业务逻辑测试

```typescript
// 业务类
class UserService {
  async create(name: string, email: string) {
    // 验证
    if (!name || name.length < 2) {
      throw new Error('姓名至少 2 个字符')
    }
    
    if (!email.includes('@')) {
      throw new Error('邮箱格式不正确')
    }
    
    // 保存到数据库...
    return { id: 1, name, email }
  }
  
  async delete(id: number) {
    // 检查用户存在...
    // 删除...
    return true
  }
}

// 测试
describe('UserService', () => {
  const service = new UserService()
  
  it('创建有效用户', async () => {
    const user = await service.create('张三', 'test@example.com')
    expect(user.name).toBe('张三')
    expect(user.email).toBe('test@example.com')
  })
  
  it('姓名太短抛出错误', async () => {
    await expect(service.create('张', 'test@example.com'))
      .rejects.toThrow('姓名至少 2 个字符')
  })
  
  it('邮箱格式错误抛出错误', async () => {
    await expect(service.create('张三', 'invalid'))
      .rejects.toThrow('邮箱格式不正确')
  })
})
```

---

## 集成测试

### API 集成测试

```typescript
import { describe, expect, it, beforeEach } from 'bun:test'
import { Elysia, t } from 'elysia'

describe('完整 API 流程测试', () => {
  let app: Elysia
  let users: any[] = []
  
  beforeEach(() => {
    app = new Elysia()
      .get('/users', () => users)
      .post('/users', ({ body }) => {
        const newUser = { id: users.length + 1, ...body }
        users.push(newUser)
        return newUser
      }, {
        body: t.Object({ name: t.String() })
      })
      .put('/users/:id', ({ body, params }) => {
        const id = Number(params.id)
        const user = users.find(u => u.id === id)
        if (!user) throw new Error('用户不存在')
        Object.assign(user, body)
        return user
      })
      .delete('/users/:id', ({ params }) => {
        const id = Number(params.id)
        users = users.filter(u => u.id !== id)
        return { success: true }
      })
  })
  
  it('完整 CRUD 流程', async () => {
    // Create
    const createRes = await app.handle(
      new Request('http://localhost/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '张三' })
      })
    )
    const newUser = await createRes.json()
    expect(newUser.id).toBe(1)
    
    // Read
    const listRes = await app.handle(new Request('http://localhost/users'))
    const list = await listRes.json()
    expect(list).toHaveLength(1)
    
    // Update
    const updateRes = await app.handle(
      new Request('http://localhost/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '李四' })
      })
    )
    const updated = await updateRes.json()
    expect(updated.name).toBe('李四')
    
    // Delete
    const deleteRes = await app.handle(
      new Request('http://localhost/users/1', { method: 'DELETE' })
    )
    expect((await deleteRes.json()).success).toBe(true)
    
    // Verify
    const listAfter = await app.handle(new Request('http://localhost/users'))
    expect(await listAfter.json()).toHaveLength(0)
  })
})
```

### 数据库集成测试

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { PrismaClient } from '@prisma/client'

describe('数据库集成测试', () => {
  const prisma = new PrismaClient()
  
  beforeEach(async () => {
    // 清理数据库
    await prisma.user.deleteMany()
  })
  
  afterEach(async () => {
    await prisma.$disconnect()
  })
  
  it('创建并查询用户', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: '张三' }
    })
    
    expect(user.email).toBe('test@example.com')
    
    const found = await prisma.user.findUnique({
      where: { id: user.id }
    })
    
    expect(found?.name).toBe('张三')
  })
})
```

---

## Mock 技术

### Mock 函数

```typescript
import { describe, expect, it, mock } from 'bun:test'

describe('Mock 示例', () => {
  it('mock 返回值', () => {
    const fn = mock().mockReturnValue('mocked')
    expect(fn()).toBe('mocked')
  })
  
  it('mock 实现', () => {
    const fn = mock((x: number) => x * 2)
    expect(fn(5)).toBe(10)
  })
  
  it('mock 抛出错误', () => {
    const fn = mock().mockImplementation(() => {
      throw new Error('Test error')
    })
    expect(() => fn()).toThrow('Test error')
  })
})
```

### Mock 定时器

```typescript
import { describe, expect, it, mock } from 'bun:test'

describe('Mock 定时器', () => {
  it('模拟 setTimeout', async () => {
    mock.timers.enable({ apis: ['setTimeout'] })
    
    const callback = mock()
    setTimeout(callback, 1000)
    expect(callback).not.toHaveBeenCalled()
    
    await mock.timers.tick(1000)
    expect(callback).toHaveBeenCalledTimes(1)
    
    mock.timers.disable()
  })
})
```

### Spy 对象方法

```typescript
import { describe, expect, it, spyOn } from 'bun:test'

describe('Spy 示例', () => {
  const logger = {
    log(msg: string) { console.log(msg) },
    error(msg: string) { console.error(msg) }
  }
  
  it('spyOn 监控调用', () => {
    const spy = spyOn(logger, 'log')
    logger.log('test')
    expect(spy).toHaveBeenCalledWith('test')
    spy.mockRestore()
  })
})
```

---

## 测试覆盖率

### 生成覆盖率报告

```bash
# 运行测试并生成覆盖率
bun test --coverage

# 查看覆盖率
cat coverage.txt
```

### 覆盖率配置

```json
// bunfig.toml
[test]
coverage = true
```

### 覆盖率目标

```bash
# 设置最低覆盖率要求
# (需要在 CI 中配置)
bun test --coverage --coverage-threshold-lines=80
```

---

## 持续集成

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  image: node:18
  script:
    - npm install -g bun
    - bun install
    - bun test
  coverage: '/lines\s*:\s*(\d+\.\d+\%)/'
```

---

## 测试最佳实践

### ✅ DO - 应该做的

1. **测试公开 API**
   ```typescript
   // 测试模块的公开方法
   export class UserService {
     public async create() {} // 测试这个
     private validate() {} // 不直接测试
   }
   ```

2. **使用描述性名称**
   ```typescript
   // ❌ 不好
   it('测试用户', () => {})
   
   // ✅ 好
   it('创建用户时邮箱必须有效', () => {})
   ```

3. **Arrange-Act-Assert**
   ```typescript
   it('添加商品到购物车', () => {
     // Arrange (准备)
     const cart = new Cart()
     const product = { id: 1, price: 100 }
     
     // Act (执行)
     cart.add(product, 2)
     
     // Assert (断言)
     expect(cart.total).toBe(200)
   })
   ```

4. **测试边界条件**
   ```typescript
   it('处理空数组', () => {})
   it('处理单个元素', () => {})
   it('处理超大数值', () => {})
   ```

### ❌ DON'T - 不应该做的

1. **不要测试实现细节**
   ```typescript
   // ❌ 不要测试私有方法
   it('_validate 应该返回 true', () => {})
   
   // ✅ 测试公开行为
   it('创建用户应该验证邮箱', () => {})
   ```

2. **不要相互依赖的测试**
   ```typescript
   // ❌ 错误：测试有依赖
   it('1. 创建用户', () => { /* */ })
   it('2. 更新上一步的用户', () => { /* */ })
   
   // ✅ 正确：每个测试独立
   it('创建用户', () => { /* */ })
   it('更新用户', () => {
     const user = createUser() // 自己创建数据
   })
   ```

3. **不要使用硬编码**
   ```typescript
   // ❌ 不好
   const result = process(data)
   expect(result.length).toBe(5) // 5 是什么？
   
   // ✅ 好
   expect(result.length).toBe(expectedCount)
   ```

---

## 测试检查清单

- [ ] 单元测试覆盖核心业务逻辑
- [ ] 集成测试验证模块协作
- [ ] 所有测试独立运行
- [ ] 测试名称清晰描述意图
- [ ] 测试包含边界条件
- [ ] 测试数据与实际数据相似
- [ ] Mock 外部依赖
- [ ] CI/CD 自动运行测试
- [ ] 覆盖率报告生成
- [ ] 回归测试包含新 bug

---

祝你写出高质量的测试！🧪
