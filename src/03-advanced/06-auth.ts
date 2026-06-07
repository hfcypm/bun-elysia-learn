/**
 * Level 3 - 实战项目: Auth
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 开发完整的业务系统
 * 2. ✅ 实现用户认证和授权
 * 3. ✅ 处理复杂的数据关系
 * 4. ✅ 实现 WebSocket 实时通信
 * 5. ✅ 掌握 API 最佳实践
 * 
 * ⚠️ 注意事项：
 * - 注意代码组织和模块拆分
 * - 错误处理要完善
 * - 密码必须加密存储
 * - JWT 设置合理的过期时间
 * - 注意性能优化
 * 
 * 📝 练习任务：
 * - 扩展系统功能
 * - 添加单元测试
 * - 优化查询性能
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'
import { jwt, SignJWTFields } from '@elysiajs/jwt'

// 模拟数据库
interface User {
  id: number
  username: string
  email: string
  password: string
  role: 'user' | 'admin'
  createdAt: string
}

const users: User[] = []

// JWT 密钥 (生产环境应该从环境变量读取)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

const app = new Elysia()
  // JWT 插件
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET
  }))

  // ========== 用户注册 ==========
  .post('/auth/register', async ({ body, set }) => {
    // 检查用户是否已存在
    const existingUser = users.find(
      u => u.username === body.username || u.email === body.email
    )

    if (existingUser) {
      set.status = 400
      return {
        success: false,
        message: '用户名或邮箱已被使用'
      }
    }

    // 简单密码加密 (生产环境请使用 bcrypt 等)
    const hashedPassword = Buffer.from(body.password).toString('base64')

    const newUser: User = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      username: body.username,
      email: body.email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    return {
      success: true,
      message: '注册成功',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 3, maxLength: 20 }),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6, maxLength: 100 })
    })
  })

  // ========== 用户登录 ==========
  .post('/auth/login', async ({ body, set, jwt }) => {
    const user = users.find(u => u.username === body.username)

    // 验证用户
    if (!user) {
      set.status = 401
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 验证密码
    const hashedInput = Buffer.from(body.password).toString('base64')
    if (user.password !== hashedInput) {
      set.status = 401
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 生成 Access Token (有效期 15 分钟)
    const accessToken = await jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'access'
    } as SignJWTFields, {
      exp: Math.floor(Date.now() / 1000) + (15 * 60)
    })

    // 生成 Refresh Token (有效期 7 天)
    const refreshToken = await jwt.sign({
      id: user.id,
      type: 'refresh'
    } as SignJWTFields, {
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    })

    return {
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15 分钟',
          tip: '将 accessToken 放入请求头 Authorization: Bearer <token>'
        }
      }
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })

  // ========== 刷新 Token ==========
  .post('/auth/refresh', async ({ body, set, jwt }) => {
    try {
      // 验证 Refresh Token
      const payload = await jwt.verify(body.refreshToken)

      if (!payload || payload.type !== 'refresh') {
        set.status = 401
        return {
          success: false,
          message: '无效的 Refresh Token'
        }
      }

      const user = users.find(u => u.id === payload.id)
      if (!user) {
        set.status = 401
        return {
          success: false,
          message: '用户不存在'
        }
      }

      // 生成新的 Access Token
      const newAccessToken = await jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
        type: 'access'
      } as SignJWTFields, {
        exp: Math.floor(Date.now() / 1000) + (15 * 60)
      })

      return {
        success: true,
        message: 'Token 刷新成功',
        data: {
          accessToken: newAccessToken,
          expiresIn: '15 分钟'
        }
      }
    } catch (error) {
      set.status = 401
      return {
        success: false,
        message: 'Token 验证失败'
      }
    }
  }, {
    body: t.Object({
      refreshToken: t.String()
    })
  })

  // ========== 受保护的路由 ==========
  .derive({ as: 'scoped' }, async ({ request, set, jwt }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return {
        user: null,
        isAuthenticated: false
      }
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const payload = await jwt.verify(token)

      if (!payload || payload.type !== 'access') {
        set.status = 401
        return {
          user: null,
          isAuthenticated: false
        }
      }

      const user = users.find(u => u.id === payload.id)
      if (!user) {
        set.status = 401
        return {
          user: null,
          isAuthenticated: false
        }
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        isAuthenticated: true
      }
    } catch (error) {
      set.status = 401
      return {
        user: null,
        isAuthenticated: false
      }
    }
  })

  // 获取当前用户信息
  .get('/auth/me', ({ user, set }) => {
    if (!user) {
      set.status = 401
      return {
        success: false,
        message: '未登录'
      }
    }

    return {
      success: true,
      data: user
    }
  })

  // 更新用户信息
  .put('/auth/me', async ({ user, body, set }) => {
    if (!user) {
      set.status = 401
      return {
        success: false,
        message: '未登录'
      }
    }

    const userIndex = users.findIndex(u => u.id === user.id)
    if (userIndex === -1) {
      set.status = 404
      return {
        success: false,
        message: '用户不存在'
      }
    }

    // 更新允许修改的字段
    if (body.email) {
      users[userIndex].email = body.email
    }

    return {
      success: true,
      message: '个人信息更新成功',
      data: {
        id: users[userIndex].id,
        username: users[userIndex].username,
        email: users[userIndex].email,
        role: users[userIndex].role
      }
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email' }))
    })
  })

  // 修改密码
  .put('/auth/change-password', async ({ user, body, set }) => {
    if (!user) {
      set.status = 401
      return {
        success: false,
        message: '未登录'
      }
    }

    const userIndex = users.findIndex(u => u.id === user.id)
    
    // 验证旧密码
    const hashedOldPassword = Buffer.from(body.oldPassword).toString('base64')
    if (users[userIndex].password !== hashedOldPassword) {
      set.status = 400
      return {
        success: false,
        message: '原密码错误'
      }
    }

    // 更新密码
    users[userIndex].password = Buffer.from(body.newPassword).toString('base64')

    return {
      success: true,
      message: '密码修改成功'
    }
  }, {
    body: t.Object({
      oldPassword: t.String(),
      newPassword: t.String({ minLength: 6 })
    })
  })

  // ========== 管理员接口 ==========
  .get('/admin/users', ({ user, set }) => {
    if (!user || user.role !== 'admin') {
      set.status = 403
      return {
        success: false,
        message: '需要管理员权限'
      }
    }

    // 返回所有用户（隐藏密码）
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }))

    return {
      success: true,
      data: safeUsers,
      total: safeUsers.length
    }
  })

  // ========== 公开接口 ==========
  .get('/health', () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  })

app.listen(3005, () => {
  console.log('🚀 认证 API 运行在 http://localhost:3005')
  console.log('📝 API 端点:')
  console.log('\n认证相关:')
  console.log('   POST /auth/register        用户注册')
  console.log('   POST /auth/login           用户登录')
  console.log('   POST /auth/refresh         刷新 Token')
  console.log('   GET  /auth/me              获取当前用户 (需要认证)')
  console.log('   PUT  /auth/me              更新个人信息 (需要认证)')
  console.log('   PUT  /auth/change-password 修改密码 (需要认证)')
  console.log('\n管理员:')
  console.log('   GET  /admin/users          获取所有用户 (需要管理员权限)')
  console.log('\n健康检查:')
  console.log('   GET  /health               健康检查')
  console.log('\n💡 测试流程:')
  console.log('   1. 注册新用户')
  console.log('   2. 登录获取 Token')
  console.log('   3. 使用 Token 访问受保护接口')
  console.log('   4. Token 过期后使用 Refresh Token 刷新')
})
