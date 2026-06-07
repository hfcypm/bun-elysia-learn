/**
 * 示例片段: Cors
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现细节
 * 3. ✅ 可以组合到项目中
 * 
 * ⚠️ 注意事项：
 * - 示例代码可以复制使用
 * - 根据需求调整配置
 * - 参考完整案例学习
 * 
 * 📝 练习任务：
 * - 运行示例
 * - 修改参数测试
 * - 集成到自己的项目
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

// ============ 环境配置 ============
const isDev = process.env.NODE_ENV === 'development'
const allowedOrigins = isDev
  ? [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]
  : [
      'https://your-domain.com',
      'https://www.your-domain.com',
      'https://app.your-domain.com',
    ]

// ============ CORS 配置 ============
const corsConfig = {
  // 允许的源（动态验证）
  origin: (origin: string) => {
    // 开发环境允许所有 localhost
    if (isDev && origin?.includes('localhost')) {
      return true
    }
    
    // 生产环境严格验证
    if (allowedOrigins.includes(origin)) {
      return origin
    }
    
    // 拒绝其他来源
    return false
  },
  
  // 允许的方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // 允许的请求头
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  
  // 允许暴露的响应头（前端可以读取）
  exposedHeaders: [
    'X-Total-Count',  // 分页总数
    'X-Page',         // 当前页码
    'X-Per-Page',     // 每页数量
  ],
  
  // 允许携带凭证（Cookie）
  credentials: true,
  
  // 预检请求缓存时间（秒）
  maxAge: 86400,  // 24 小时
}

const app = new Elysia()
  // ============ 使用 CORS 中间件 ============
  .use(cors(corsConfig))
  
  // ============ 全局请求日志 ============
  .onRequest(({ request, set }) => {
    const origin = request.headers.get('origin')
    const method = request.method
    const path = new URL(request.url).pathname
    
    // 记录跨域请求
    console.log(`[${method}] ${path} - Origin: ${origin || 'Direct'}`)
    
    // 记录 CORS 头
    set.headers['X-CORS-Enabled'] = 'true'
    set.headers['X-Request-ID'] = crypto.randomUUID()
  })
  
  // ============ 根路径 ============
  .get('/', () => ({
    name: 'CORS 完整示例 (生产级)',
    version: '2.0.0',
    description: '包含开发/生产环境配置、前端调用示例、错误排查',
    cors_enabled: true,
    environment: process.env.NODE_ENV || 'development',
  }))
  
  // ============ CORS 配置信息 ============
  .get('/cors-info', ({ request }) => {
    const origin = request.headers.get('origin')
    
    return {
      message: 'CORS 配置信息',
      current_request: {
        origin: origin || '无 (直接访问)',
        is_allowed: !origin || allowedOrigins.includes(origin) || isDev,
      },
      cors_config: {
        environment: isDev ? '开发环境' : '生产环境',
        allowed_origins: allowedOrigins,
        methods: corsConfig.methods,
        allowed_headers: corsConfig.allowedHeaders,
        exposed_headers: corsConfig.exposedHeaders,
        credentials: corsConfig.credentials,
        max_age: `${corsConfig.maxAge}秒 (${corsConfig.maxAge / 3600}小时)`,
      },
      testing: {
        browser_console: `
// 在浏览器控制台执行 (F12):
fetch('http://localhost:3302/api/data', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'  // 携带 Cookie
})
  .then(r => r.json())
  .then(console.log)
        `.trim(),
        curl_get: 'curl -i http://localhost:3302/api/data',
        curl_post: 'curl -X POST http://localhost:3302/api/submit -H "Content-Type: application/json" -d \'{"test": "data"}\'',
        curl_options: 'curl -X OPTIONS http://localhost:3302/api/data -i',
      },
      endpoints: {
        'GET /': '欢迎信息',
        'GET /cors-info': 'CORS 配置信息（当前接口）',
        'GET /api/data': '获取数据（测试跨域）',
        'POST /api/submit': '提交数据（测试 POST）',
        'GET /api/user': '用户信息（需要认证）',
        'POST /api/login': '登录接口（设置 Cookie）',
        'GET /api/protected': '受保护接口（需要 Cookie）',
      },
    }
  })
  
  // ============ 获取数据（GET 跨域测试）============
  .get('/api/data', ({ request }) => {
    const origin = request.headers.get('origin')
    
    return {
      success: true,
      data: {
        items: [
          { id: 1, name: '项目 1', status: 'active' },
          { id: 2, name: '项目 2', status: 'active' },
          { id: 3, name: '项目 3', status: 'inactive' },
        ],
        total: 3,
        timestamp: new Date().toISOString(),
      },
      cors: {
        origin: origin || 'Direct Access',
        allowed: true,
        is_preflight: request.method === 'OPTIONS',
      },
      headers_received: {
        origin: origin,
        'user-agent': request.headers.get('user-agent')?.slice(0, 50) + '...',
      },
    }
  })
  
  // ============ 提交数据（POST 跨域测试）============
  .post('/api/submit', ({ body, request }) => {
    const origin = request.headers.get('origin')
    
    return {
      success: true,
      message: '数据提交成功',
      data: body,
      cors: {
        origin: origin || 'Direct Access',
        method: 'POST',
        content_type: request.headers.get('content-type'),
      },
      meta: {
        received_at: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    }
  })
  
  // ============ 登录接口（设置 Cookie）============
  .post('/api/login', ({ cookie, body, set }) => {
    const { username, password } = body as { username?: string; password?: string }
    
    // 简单验证（实际项目用 JWT）
    if (username !== 'demo' || password !== '123456') {
      return {
        success: false,
        message: '用户名或密码错误',
      }
    }
    
    // 设置 Cookie
    cookie.set('session_token', 'demo-session-token-xyz', {
      httpOnly: true,
      secure: !isDev,  // 生产环境仅 HTTPS
      sameSite: 'lax',
      maxAge: 3600,  // 1 小时
      path: '/',
    })
    
    return {
      success: true,
      message: '登录成功',
      data: {
        username,
        token: 'demo-session-token-xyz',
        expires_in: 3600,
      },
      cors: {
        credentials_enabled: corsConfig.credentials,
        cookie_set: true,
      },
    }
  })
  
  // ============ 受保护接口（需要 Cookie）============
  .get('/api/protected', ({ cookie, request }) => {
    const sessionToken = cookie.session_token?.value
    const origin = request.headers.get('origin')
    
    if (!sessionToken) {
      return {
        success: false,
        message: '未登录，请先调用 /api/login',
        cors: {
          origin: origin || 'Direct Access',
          credentials_required: true,
        },
      }
    }
    
    return {
      success: true,
      message: '访问受保护资源成功',
      data: {
        username: 'demo',
        role: 'user',
        session: sessionToken,
      },
      cors: {
        origin: origin || 'Direct Access',
        credentials_verified: true,
      },
    }
  })
  
  // ============ 用户信息（需要 Authorization）============
  .get('/api/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const origin = request.headers.get('origin')
    
    if (!authHeader) {
      return {
        success: false,
        message: '缺少 Authorization 头',
        cors: {
          origin: origin || 'Direct Access',
          required_headers: ['Authorization'],
        },
        hint: '请在请求头中添加：Authorization: Bearer your-token',
      }
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    return {
      success: true,
      data: {
        username: 'demo-user',
        role: 'user',
        token_preview: token.slice(0, 10) + '...',
        token_length: token.length,
      },
      cors: {
        origin: origin || 'Direct Access',
        authorization_verified: true,
      },
    }
  })
  
  // ============ 分页接口（测试 exposedHeaders）============
  .get('/api/items', ({ request, set }) => {
    const page = 1
    const perPage = 10
    const total = 100
    
    // 设置自定义响应头（前端可以读取）
    set.headers['X-Total-Count'] = total.toString()
    set.headers['X-Page'] = page.toString()
    set.headers['X-Per-Page'] = perPage.toString()
    
    return {
      success: true,
      data: {
        items: Array.from({ length: perPage }, (_, i) => ({
          id: i + 1,
          name: `项目 ${i + 1}`,
        })),
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
        },
      },
      cors: {
        exposed_headers: corsConfig.exposedHeaders,
        custom_headers_set: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
      },
    }
  })
  
  // ============ 错误测试接口（CORS 错误演示）============
  .get('/api/test-error', () => {
    // 这个接口会触发 CORS 错误（如果前端源不在白名单）
    return {
      success: true,
      message: '如果你在浏览器看到这个错误，说明 CORS 配置有问题',
      error_scenario: {
        description: '常见 CORS 错误场景',
        errors: [
          {
            error: 'No Access-Control-Allow-Origin',
            reason: '后端未配置 CORS 或 origin 不匹配',
            solution: '检查 cors() 中间件的 origin 配置',
          },
          {
            error: 'Credentials flag is true but Access-Control-Allow-Credentials is false',
            reason: 'credentials 配置不一致',
            solution: '确保服务端 credentials: true',
          },
          {
            error: 'Method not allowed',
            reason: 'OPTIONS 预检被拦截',
            solution: '确保允许 OPTIONS 方法',
          },
          {
            error: 'Header xyz not allowed',
            reason: '自定义请求头未在白名单',
            solution: '添加到 allowedHeaders',
          },
        ],
      },
    }
  })

// ============ 启动服务器 ============
const port = 3302
app.listen(port, () => {
  console.log('🚀 CORS 服务器已启动')
  console.log(`   地址：http://localhost:${port}`)
  console.log(`   环境：${isDev ? '开发' : '生产'}`)
  console.log('')
  console.log('📝 快速测试:')
  console.log('   1. 浏览器访问：http://localhost:3302/cors-info')
  console.log('   2. 查看配置：GET /cors-info')
  console.log('   3. 跨域测试：GET /api/data')
  console.log('   4. 登录测试：POST /api/login')
  console.log('')
  console.log('💡 前端调用示例 (React/Vue):')
  console.log(`
// React/Vue 前端代码
async function fetchData() {
  const res = await fetch('http://localhost:3302/api/data', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'  // 携带 Cookie
  })
  const data = await res.json()
  console.log(data)
}

// 登录并访问受保护接口
async function loginAndAccess() {
  // 1. 登录
  await fetch('http://localhost:3302/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'demo', password: '123456' })
  })
  
  // 2. 访问受保护接口
  const res = await fetch('http://localhost:3302/api/protected', {
    credentials: 'include'
  })
  const data = await res.json()
  console.log(data)
}
  `)
  console.log('📖 更多说明请查看：docs/GITHUB_ACTIONS_DEPLOY_GUIDE.md')
  console.log('')
})
