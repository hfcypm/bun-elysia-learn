/**
 * CORS 中间件示例
 * 知识点：跨域资源共享配置
 * 运行：npx tsx examples/03-middleware/cors.ts
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

// 手动实现 CORS 中间件示例
const manualCors = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}

const app = new Elysia()
  // 方式 1: 使用官方 cors 插件 (推荐)
  .use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
  }))

  // 方式 2: 手动设置 CORS 头 (学习用)
  .onRequest(({ request, set }) => {
    // 设置 CORS 头
    set.headers['Access-Control-Allow-Origin'] = manualCors.origin
    set.headers['Access-Control-Allow-Methods'] = manualCors.methods.join(', ')
    set.headers['Access-Control-Allow-Headers'] = manualCors.allowedHeaders.join(', ')
    set.headers['Access-Control-Allow-Credentials'] = manualCors.credentials.toString()
    set.headers['Access-Control-Max-Age'] = manualCors.maxAge.toString()
    
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }
  })

  // 公开接口
  .get('/', () => {
    return {
      message: 'CORS 示例',
      cors: '已启用跨域访问'
    }
  })

  // 获取数据接口
  .get('/api/data', () => {
    return {
      success: true,
      data: {
        items: ['Item 1', 'Item 2', 'Item 3'],
        timestamp: new Date().toISOString()
      },
      cors: {
        enabled: true,
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5173']
      }
    }
  })

  // 提交数据接口
  .post('/api/submit', ({ body }) => {
    return {
      success: true,
      message: '数据提交成功',
      data: body
    }
  })

  // 需要认证的接口
  .get('/api/user', ({ request }) => {
    const token = request.headers.get('Authorization')
    
    if (!token) {
      return {
        success: false,
        message: '需要 Token'
      }
    }
    
    return {
      success: true,
      data: {
        username: 'demo-user',
        role: 'user',
        token: token.replace('Bearer ', '').slice(0, 10) + '...'
      }
    }
  })

  // 预检请求提示
  .get('/cors-info', () => {
    return {
      message: 'CORS 配置信息',
      cors: {
        origin: manualCors.origin,
        methods: manualCors.methods,
        headers: manualCors.allowedHeaders,
        credentials: manualCors.credentials,
        maxAge: `${manualCors.maxAge}秒 (${manualCors.maxAge / 3600}小时)`
      },
      testing: {
        postman: '直接在 Postman 中访问即可',
        browser: '需要在浏览器控制台查看 Network 选项卡',
        curl: 'curl -i http://localhost:3302/api/data'
      }
    }
  })

app.listen(3302, () => {
  console.log('🚀 服务器运行在 http://localhost:3302')
  console.log('\n📝 CORS 配置说明:')
  console.log('   允许的源：http://localhost:3000, http://localhost:5173')
  console.log('   允许的方法：GET, POST, PUT, DELETE, PATCH, OPTIONS')
  console.log('   允许的请求头：Content-Type, Authorization')
  console.log('   允许携带 Cookie: true')
  console.log('   预检请求缓存：86400 秒')
  console.log('\n📝 测试接口:')
  console.log('   GET /              - CORS 示例说明')
  console.log('   GET /cors-info     - 查看 CORS 配置')
  console.log('   GET /api/data      - 获取数据 (跨域)')
  console.log('   POST /api/submit   - 提交数据 (跨域)')
  console.log('   GET /api/user      - 需要认证')
  console.log('\n💡 浏览器测试:')
  console.log('   在浏览器控制台使用 fetch 访问这些接口')
  console.log('   观察网络请求的响应头')
  console.log('\n例如:')
  console.log('   fetch("http://localhost:3302/api/data")')
  console.log('     .then(r => r.json())')
  console.log('     .then(console.log)')
})
