/**
 * Level 2 - 进阶技能: Middleware
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 掌握请求验证（TypeBox）
 * 2. ✅ 理解中间件的工作原理
 * 3. ✅ 实现文件上传功能
 * 4. ✅ 掌握数据库 CRUD 操作
 * 5. ✅ 使用 Prisma ORM
 * 
 * ⚠️ 注意事项：
 * - 验证失败会返回 400 状态码
 * - 中间件按顺序执行
 * - 文件上传注意大小限制
 * - 数据库连接需要正确配置
 * - Prisma 需要先 generate
 * 
 * 📝 练习任务：
 * - 添加更多验证规则
 * - 实现自定义中间件
 * - 扩展数据库模型
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

// 模拟用户数据库
const users = new Map([
  ['token123', { id: 1, username: '张三', role: 'user' }],
  ['admin456', { id: 2, username: '管理员', role: 'admin' }]
])

const app = new Elysia()
  // 全局中间件 - 请求日志
  .onRequest(({ request, set }) => {
    const start = Date.now()
    const url = new URL(request.url)
    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`)

    // 在响应时记录处理时间
    set.headers['X-Request-Start'] = start.toString()
  })

  .onAfterHandle(({ request, set }) => {
    const start = set.headers['X-Request-Start']
    if (start) {
      const duration = Date.now() - parseInt(start)
      console.log(`  ✅ 耗时：${duration}ms`)
    }
  })

  // 使用 CORS 中间件
  .use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }))

  // 认证中间件
  .derive(({ request, set }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return {
        success: false,
        message: '未授权访问',
        data: null
      }
    }

    const token = authHeader.replace('Bearer ', '')
    const user = users.get(token)

    if (!user) {
      set.status = 401
      return {
        success: false,
        message: '无效的 Token',
        data: null
      }
    }

    return {
      user,
      token
    }
  })

  // 公开路由 - 不需要认证
  .group(app => app, app => app
    .get('/public', () => {
      return {
        success: true,
        message: '这是公开接口，无需认证',
        data: {
          info: '任何人都可以访问'
        }
      }
    })

    // 登录接口 - 生成模拟 token
    .post('/login', ({ body, set }) => {
      const { username, password } = body

      // 简单验证
      if (username === 'admin' && password === '123456') {
        return {
          success: true,
          message: '登录成功',
          data: {
            token: 'admin456',
            username: '管理员',
            role: 'admin',
            tip: '使用此 token 访问受保护的接口'
          }
        }
      }

      if (username === 'user' && password === '123456') {
        return {
          success: true,
          message: '登录成功',
          data: {
            token: 'token123',
            username: '张三',
            role: 'user',
            tip: '使用此 token 访问受保护的接口'
          }
        }
      }

      set.status = 401
      return {
        success: false,
        message: '用户名或密码错误',
        data: null
      }
    }, {
      body: Elysia.t.Object({
        username: Elysia.t.String(),
        password: Elysia.t.String()
      })
    })
  )

  // 受保护的路由组
  .group('/api', app => app
    // 需要登录
    .get('/profile', ({ user }) => {
      return {
        success: true,
        message: '获取个人信息成功',
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
          data: null
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

    // 管理用户
    .get('/users', ({ user }) => {
      return {
        success: true,
        message: '用户列表',
        data: Array.from(users.values()),
        requestedBy: user.username
      }
    })
  )

  // 全局 404 处理
  .onNotFound(({ request }) => {
    return {
      success: false,
      message: '接口不存在',
      path: new URL(request.url).pathname,
      tip: '请检查 URL 是否正确'
    }
  })

app.listen(3003, () => {
  console.log('🚀 服务器运行在 http://localhost:3003')
  console.log('📝 中间件 API 端点:')
  console.log('   - GET  /public              公开接口')
  console.log('   - POST /login               登录获取 token')
  console.log('   - GET  /api/profile         需要认证')
  console.log('   - GET  /api/admin           需要管理员权限')
  console.log('   - GET  /api/users           用户列表')
  console.log('\n💡 测试步骤:')
  console.log('   1. POST /login 登录获取 token')
  console.log('   2. 使用 token 访问 /api/profile')
  console.log('   3. 使用 admin token 访问 /api/admin')
})
