/**
 * 示例片段：认证中间件
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现
 * 3. ✅ 可以组合使用
 * 
 * ⚠️ 注意事项：
 * - 示例代码可复制
 * - 按需调整配置
 * - 参考完整案例
 * 
 * 📝 练习任务：
 * - 添加请求头
 * - 实现响应修改
 * - 组合中间件
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/03-middleware/auth.ts
 */

import { Elysia } from 'elysia'

// 模拟 Token 数据库
const tokens = new Map([
  ['token-user-123', { id: 1, username: 'user1', role: 'user' }],
  ['token-user-456', { id: 2, username: 'user2', role: 'user' }],
  ['token-admin-789', { id: 3, username: 'admin', role: 'admin' }]
])

const app = new Elysia()
  // 全局认证中间件 - 使用 derive 传递用户信息
  .derive(({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    
    // 没有 Authorization 头
    if (!authHeader) {
      return {
        user: null,
        isAuthenticated: false,
        token: null
      }
    }
    
    // 解析 Token
    if (!authHeader.startsWith('Bearer ')) {
      set.status = 401
      return {
        user: null,
        isAuthenticated: false,
        token: null,
        error: 'Token 格式必须是 Bearer <token>'
      }
    }
    
    const token = authHeader.replace('Bearer ', '')
    const user = tokens.get(token)
    
    // Token 无效
    if (!user) {
      set.status = 401
      return {
        user: null,
        isAuthenticated: false,
        token: null,
        error: '无效的 Token'
      }
    }
    
    // Token 有效
    return {
      user,
      isAuthenticated: true,
      token,
      error: null
    }
  })

  // 公开接口 - 不需要认证
  .get('/', () => {
    return {
      message: '欢迎使用认证系统',
      public: true
    }
  })

  // 模拟登录接口
  .post('/login', ({ body }) => {
    const { username, role } = body
    
    // 查找匹配的 Token
    for (const [token, user] of tokens.entries()) {
      if (user.username === username && user.role === role) {
        return {
          success: true,
          message: '登录成功',
          data: {
            token,
            user,
            tip: '使用此 Token 访问受保护接口：\n' + 
                 `  curl -H "Authorization: Bearer ${token}" http://localhost:3301/protected`
          }
        }
      }
    }
    
    return {
      success: false,
      message: '用户名或角色错误',
      available: Array.from(tokens.values()).map(u => ({
        username: u.username,
        role: u.role
      }))
    }
  }, {
    body: Elysia.t.Object({
      username: Elysia.t.String(),
      role: Elysia.t.Union([Elysia.t.Literal('user'), Elysia.t.Literal('admin')])
    })
  })

  // 受保护接口 - 需要认证
  .get('/protected', ({ user, isAuthenticated, error, set }) => {
    if (!isAuthenticated) {
      set.status = 401
      return {
        success: false,
        message: '需要认证',
        error: error
      }
    }
    
    return {
      success: true,
      message: '认证成功',
      data: {
        user,
        accessTime: new Date().toISOString()
      }
    }
  })

  // 使用路由组 + 中间件实现权限控制
  .group('/api/protected', app => app
    // 组中间件 - 检查认证
    .onBeforeHandle(({ user, set }) => {
      if (!user) {
        set.status = 401
        return {
          success: false,
          message: '请先登录'
        }
      }
    })

    // 用户信息
    .get('/me', ({ user }) => {
      return {
        success: true,
        data: user
      }
    })

    // 需要管理员权限
    .get('/admin', ({ user, set }) => {
      if (user.role !== 'admin') {
        set.status = 403
        return {
          success: false,
          message: '权限不足，需要管理员权限',
          yourRole: user.role,
          requiredRole: 'admin'
        }
      }
      
      return {
        success: true,
        message: '欢迎管理员!',
        data: {
          adminPanel: true,
          features: ['用户管理', '系统设置', '数据导出']
        }
      }
    })

    // 用户资源
    .get('/users/:id', ({ user, params, set }) => {
      const userId = parseInt(params.id)
      
      // 只能查看自己的信息，除非是管理员
      if (user.id !== userId && user.role !== 'admin') {
        set.status = 403
        return {
          success: false,
          message: '无权查看他人信息'
        }
      }
      
      return {
        success: true,
        data: {
          targetUserId: userId,
          requestedBy: user.username,
          isSelf: user.id === userId
        }
      }
    })
  )

  // 测试 Token 失效
  .get('/logout', () => {
    return {
      success: true,
      message: '已登出（模拟）',
      tip: '实际项目中应该在服务端使 Token 失效'
    }
  })

app.listen(3301, () => {
  console.log('🚀 服务器运行在 http://localhost:3301')
  console.log('\n📝 测试流程:')
  console.log('\n1. 获取公开接口 (无需认证):')
  console.log('   GET /')
  console.log('\n2. 登录获取 Token:')
  console.log('   POST /login')
  console.log('   Body: {"username":"user1","role":"user"}')
  console.log('   Body: {"username":"admin","role":"admin"}')
  console.log('\n3. 访问受保护接口:')
  console.log('   GET /protected')
  console.log('   Header: Authorization: Bearer token-user-123')
  console.log('\n4. 访问管理员接口:')
  console.log('   GET /api/protected/admin')
  console.log('   Header: Authorization: Bearer token-admin-789')
  console.log('\n5. 查看用户信息:')
  console.log('   GET /api/protected/users/1')
  console.log('   GET /api/protected/users/2')
  console.log('\n💡 尝试使用无效 Token 或无 Token 访问受保护接口')
})
