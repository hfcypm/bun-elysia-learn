/**
 * API 版本管理
 * 
 * 学习目标:
 * - URL 路径版本控制
 * - Header 版本控制
 * - 版本兼容性处理
 * - 废弃策略
 * 
 * 最佳实践:
 * - v1: 稳定版本，向后兼容
 * - v2: 新版本，可能破坏性变更
 * - 提供迁移指南
 * - 设置废弃时间表
 */

import { Elysia, t } from 'elysia'

// 版本配置
const API_VERSIONS = ['v1', 'v2'] as const
type ApiVersion = typeof API_VERSIONS[number]

// 模拟数据库
interface User {
  id: number
  username: string
  email: string
  // v2 新增字段
  displayName?: string
  avatar?: string
}

const users: User[] = [
  { id: 1, username: 'john', email: 'john@example.com', displayName: 'John Doe', avatar: '/avatars/john.jpg' },
  { id: 2, username: 'jane', email: 'jane@example.com', displayName: 'Jane Smith', avatar: '/avatars/jane.jpg' }
]

// v1 响应格式 (扁平化)
interface UserResponseV1 {
  id: number
  username: string
  email: string
}

// v2 响应格式 (嵌套结构)
interface UserResponseV2 {
  id: number
  profile: {
    username: string
    displayName?: string
    avatar?: string
  }
  contact: {
    email: string
  }
  metadata: {
    createdAt: string
    version: string
  }
}

// v1 转换器
function toUserV1(user: User): UserResponseV1 {
  return {
    id: user.id,
    username: user.username,
    email: user.email
  }
}

// v2 转换器
function toUserV2(user: User): UserResponseV2 {
  return {
    id: user.id,
    profile: {
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar
    },
    contact: {
      email: user.email
    },
    metadata: {
      createdAt: new Date().toISOString(),
      version: 'v2'
    }
  }
}

// 版本中间件
function apiVersionMiddleware(version: ApiVersion) {
  return new Elysia({
    name: `api-version-${version}`,
    seed: { version }
  })
    .onBeforeHandle(({ set }) => {
      set.headers['X-API-Version'] = version
      
      // v1 版本警告 (准备废弃)
      if (version === 'v1') {
        set.headers['X-API-Deprecation'] = 'true'
        set.headers['X-API-Sunset'] = '2025-12-31'
        set.headers['Warning'] = '299 - "API v1 is deprecated, please migrate to v2"'
      }
    })
}

const app = new Elysia()
  // ==================== 文档和首页 ====================
  .get('/', () => ({
    message: 'API 版本管理示例',
    versions: {
      v1: {
        status: 'deprecated',
        sunset: '2025-12-31',
        baseUrl: '/api/v1',
        changes: ['初始版本']
      },
      v2: {
        status: 'stable',
        baseUrl: '/api/v2',
        changes: [
          '响应结构优化',
          '新增 displayName 和 avatar 字段',
          '嵌套数据结构',
          '添加元数据信息'
        ]
      },
      latest: 'v2'
    },
    versionStrategies: {
      path: '/api/v1/users 或 /api/v2/users',
      header: '使用 Accept-Version: v1 或 Accept-Version: v2'
    }
  }))

  // ==================== v1 API ====================
  .group('/api/v1', app => app
    .use(apiVersionMiddleware('v1'))
    
    .get('/', () => ({
      version: 'v1',
      status: 'deprecated',
      endpoints: {
        users: '/api/v1/users',
        user: '/api/v1/users/:id'
      }
    }))

    // GET /api/v1/users - 获取用户列表
    .get('/users', () => ({
      success: true,
      version: 'v1',
      count: users.length,
      data: users.map(toUserV1)
    }))

    // GET /api/v1/users/:id - 获取单个用户
    .get('/users/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      const user = users.find(u => u.id === id)
      
      if (!user) {
        set.status = 404
        return {
          success: false,
          version: 'v1',
          error: '用户不存在'
        }
      }

      return {
        success: true,
        version: 'v1',
        data: toUserV1(user)
      }
    })

    // POST /api/v1/users - 创建用户
    .post('/users', ({ body, set }) => {
      const { username, email } = body
      
      const newUser: User = {
        id: users.length + 1,
        username,
        email
      }
      
      users.push(newUser)
      
      set.status = 201
      return {
        success: true,
        version: 'v1',
        data: toUserV1(newUser)
      }
    }, {
      body: t.Object({
        username: t.String(),
        email: t.String()
      })
    })
  )

  // ==================== v2 API ====================
  .group('/api/v2', app => app
    .use(apiVersionMiddleware('v2'))
    
    .get('/', () => ({
      version: 'v2',
      status: 'stable',
      endpoints: {
        users: '/api/v2/users',
        user: '/api/v2/users/:id',
        me: '/api/v2/me'
      },
      newFeatures: [
        '嵌套响应结构',
        '新增 /me 端点',
        '支持 displayName 和 avatar'
      ]
    }))

    // GET /api/v2/users - 获取用户列表
    .get('/users', () => ({
      success: true,
      version: 'v2',
      count: users.length,
      data: users.map(toUserV2),
      pagination: {
        page: 1,
        limit: users.length,
        total: users.length
      }
    }))

    // GET /api/v2/users/:id - 获取单个用户
    .get('/users/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      const user = users.find(u => u.id === id)
      
      if (!user) {
        set.status = 404
        return {
          success: false,
          version: 'v2',
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            details: { id }
          }
        }
      }

      return {
        success: true,
        version: 'v2',
        data: toUserV2(user)
      }
    })

    // POST /api/v2/users - 创建用户
    .post('/users', ({ body, set }) => {
      const { profile, contact } = body
      
      const newUser: User = {
        id: users.length + 1,
        username: profile.username,
        email: contact.email,
        displayName: profile.displayName,
        avatar: profile.avatar
      }
      
      users.push(newUser)
      
      set.status = 201
      return {
        success: true,
        version: 'v2',
        data: toUserV2(newUser)
      }
    }, {
      body: t.Object({
        profile: t.Object({
          username: t.String(),
          displayName: t.Optional(t.String()),
          avatar: t.Optional(t.String())
        }),
        contact: t.Object({
          email: t.String()
        })
      })
    })

    // GET /api/v2/me - 获取当前用户 (新增)
    .get('/me', ({ request, set }) => {
      // 模拟：假设第一个用户是当前用户
      const currentUser = users[0]
      
      if (!currentUser) {
        set.status = 401
        return {
          success: false,
          version: 'v2',
          error: {
            code: 'NOT_AUTHENTICATED',
            message: '请先登录'
          }
        }
      }

      return {
        success: true,
        version: 'v2',
        data: toUserV2(currentUser)
      }
    })
  )

  // ==================== 版本协商 (通过 Header) ====================
  .group('/api/users', app => app
    .get('/', ({ request, query, set }) => {
      // 从 Header 获取版本，默认为 v1
      const versionHeader = request.headers.get('accept-version') as ApiVersion | null
      const version = versionHeader || (query.version as ApiVersion) || 'v1'
      
      if (!API_VERSIONS.includes(version)) {
        set.status = 400
        return {
          error: '不支持的 API 版本',
          supported: API_VERSIONS
        }
      }
      
      set.headers['X-API-Version'] = version
      
      if (version === 'v1') {
        return {
          success: true,
          version: 'v1',
          data: users.map(toUserV1)
        }
      } else {
        return {
          success: true,
          version: 'v2',
          data: users.map(toUserV2)
        }
      }
    })
  )

  // ==================== 版本迁移指南 ====================
  .get('/migration-guide', () => ({
    from: 'v1',
    to: 'v2',
    breakingChanges: [
      {
        field: '响应结构',
        v1: '扁平化结构',
        v2: '嵌套结构 (profile, contact, metadata)',
        action: '更新响应解析逻辑'
      },
      {
        field: '用户创建',
        v1: '{ username, email }',
        v2: '{ profile: {}, contact: {} }',
        action: '修改请求体结构'
      }
    ],
    newFeatures: [
      '新增 displayName 和 avatar 字段',
      '新增 /me 端点获取当前用户',
      '新增分页信息',
      '更详细的错误响应'
    ],
    migrationSteps: [
      '1. 更新 API 客户端使用 /api/v2 路径',
      '2. 修改响应解析逻辑适配嵌套结构',
      '3. 更新创建用户的请求体格式',
      '4. 利用新的 displayName 和 avatar 功能',
      '5. 测试所有功能确保兼容性'
    ],
    timeline: {
      v2Release: '2024-01-01',
      v1DeprecationNotice: '2024-06-01',
      v1Sunset: '2025-12-31'
    }
  }))

  .listen(3019)

console.log('🔢 API 版本管理服务运行在 http://localhost:3019')
console.log('📖 测试端点:')
console.log('   === 文档 ===')
console.log('   GET / - API 信息')
console.log('   GET /migration-guide - 迁移指南')
console.log('   === 路径版本 ===')
console.log('   GET /api/v1/users - v1 版本 (已废弃)')
console.log('   GET /api/v2/users - v2 版本 (稳定)')
console.log('   === Header 版本 ===')
console.log('   GET /api/users - 根据 Accept-Version header 返回对应版本')
console.log('   curl -H "Accept-Version: v2" http://localhost:3019/api/users')
console.log('')
console.log('💡 版本策略:')
console.log('   1. URL 路径：/api/v1/resource, /api/v2/resource')
console.log('   2. HTTP Header: Accept-Version: v2')
console.log('   3. 查询参数：?version=v2')

export type ApiVersioningApp = typeof app
