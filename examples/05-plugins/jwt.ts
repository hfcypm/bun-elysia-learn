/**
 * 示例片段：JWT 插件
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
 * - 配置插件选项
 * - 添加插件功能
 * - 参考官方文档
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/05-plugins/jwt.ts
 */

import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
  // 使用 JWT 插件
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'elysia-jwt-secret-key-2024'
    })
  )
  // 公开路由
  .get('/', () => ({
    message: '欢迎使用 JWT 示例',
    docs: '/swagger'
  }))

  // 登录接口 - 签发 Token
  .post('/auth/login', async ({ body, jwt, set }) => {
    const { username, password } = body

    // 模拟验证 (实际项目中应从数据库验证)
    if (username !== 'admin' || password !== 'password') {
      set.status = 401
      return {
        success: false,
        error: '用户名或密码错误'
      }
    }

    // 签发 JWT Token
    const token = await jwt.sign({
      username,
      role: 'admin',
      iat: Date.now()
    })

    return {
      success: true,
      message: '登录成功',
      data: {
        token,
        expiresIn: '24h',
        user: { username, role: 'admin' }
      }
    }
  }, {
    body: (t) => ({
      username: t.String({ minLength: 3 }),
      password: t.String({ minLength: 6 })
    })
  })

  // 受保护的路由 - 需要 JWT 认证
  .get('/protected/resource', async ({ jwt, request, set }) => {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return {
        success: false,
        error: '未提供认证 token',
        message: '请在 Authorization header 中提供 Bearer token'
      }
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    try {
      // 验证并解析 token
      const profile = await jwt.verify(token)

      if (!profile) {
        set.status = 401
        return {
          success: false,
          error: 'Token 无效'
        }
      }

      return {
        success: true,
        message: '认证成功，访问受保护资源',
        data: {
          resource: '这是受保护的数据',
          user: profile,
          accessedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      set.status = 401
      return {
        success: false,
        error: 'Token 验证失败',
        message: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 获取当前用户信息
  .get('/auth/me', async ({ jwt, request, set }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { success: false, error: '未认证' }
    }

    const token = authHeader.substring(7)
    
    try {
      const profile = await jwt.verify(token)
      
      if (!profile) {
        set.status = 401
        return { success: false, error: 'Token 无效' }
      }

      return {
        success: true,
        data: {
          username: profile.username,
          role: profile.role,
          issuedAt: profile.iat
        }
      }
    } catch (error) {
      set.status = 401
      return { success: false, error: 'Token 验证失败' }
    }
  })

  // 刷新 Token
  .post('/auth/refresh', async ({ jwt, request, body, set }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { success: false, error: '未提供 token' }
    }

    const token = authHeader.substring(7)
    
    try {
      const profile = await jwt.verify(token)
      
      if (!profile) {
        set.status = 401
        return { success: false, error: 'Token 已过期' }
      }

      // 签发新 token
      const newToken = await jwt.sign({
        username: profile.username,
        role: profile.role,
        iat: Date.now()
      })

      return {
        success: true,
        message: 'Token 刷新成功',
        data: {
          token: newToken,
          expiresIn: '24h'
        }
      }
    } catch (error) {
      set.status = 401
      return { success: false, error: '原 Token 无效' }
    }
  })

  // 使用 JWT 中间件保护路由组
  .guard({
    beforeHandle: async ({ jwt, request, set }) => {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader?.startsWith('Bearer ')) {
        set.status = 401
        return { success: false, error: '需要认证' }
      }

      const token = authHeader.substring(7)
      
      try {
        const profile = await jwt.verify(token)
        
        if (!profile) {
          set.status = 401
          return { success: false, error: 'Token 无效' }
        }

        // 将用户信息存入上下文，供后续处理器使用
        return { user: profile }
      } catch (error) {
        set.status = 401
        return { success: false, error: '认证失败' }
      }
    }
  })
  .group('/api', app => app
    .get('/dashboard', ({ user }) => ({
      success: true,
      message: '欢迎回来',
      dashboard: {
        username: user.username,
        role: user.role,
        stats: {
          visits: 1234,
          actions: 567
        }
      }
    }))

    .get('/profile', ({ user }) => ({
      success: true,
      data: {
        username: user.username,
        role: user.role,
        permissions: user.role === 'admin' ? ['read', 'write', 'delete'] : ['read']
      }
    }))
  )

  .listen(3009)

console.log('🔐 JWT 认证服务运行在 http://localhost:3009')
console.log('📖 测试端点:')
console.log('   POST /auth/login - 登录获取 Token (username: admin, password: password)')
console.log('   GET  /auth/me - 获取当前用户信息')
console.log('   POST /auth/refresh - 刷新 Token')
console.log('   GET  /protected/resource - 访问受保护资源 (需 Authorization header)')
console.log('   GET  /api/dashboard - 仪表板 (需认证)')
console.log('   GET  /api/profile - 用户资料 (需认证)')
console.log('')
console.log('💡 测试步骤:')
console.log('   1. 登录获取 token: curl -X POST http://localhost:3009/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"password"}\'')
console.log('   2. 使用 token: curl http://localhost:3009/protected/resource -H "Authorization: Bearer <token>"')

export type JWTApp = typeof app
