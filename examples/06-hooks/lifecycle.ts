/**
 * 示例片段: Lifecycle
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 理解 Hooks 生命周期
 * 2. ✅ 使用 transform 钩子
 * 3. ✅ 使用生命周期钩子
 * 4. ✅ 拦截和处理请求
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3012，被占用请修改
 * - 示例代码可直接复制
 * - 根据项目需求调整
 * - 参考完整案例深入学习
 * 
 * 📝 练习任务：
 * - 运行示例测试效果
 * - 修改参数观察变化
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/06-hooks/lifecycle.ts
 * 测试：http://localhost:3012
 */

import { Elysia, t } from 'elysia'

// 请求计数器
let requestCount = 0
const requestLog: any[] = []

const app = new Elysia()
  // ==================== 服务器启动钩子 ====================
  .onStart(() => {
    console.log('🚀 服务器正在启动...')
    console.log('⏰ 启动时间:', new Date().toISOString())
  })

  // ==================== 请求钩子 (最早执行) ====================
  .onRequest((ctx) => {
    requestCount++
    const startTime = Date.now()
    
    console.log(`\n📥 [${requestCount}] ${ctx.request.method} ${ctx.request.url}`)
    
    // 记录请求开始时间
    ctx.store.requestStartTime = startTime
  })

  // ==================== 解析后钩子 ====================
  .onParse((ctx) => {
    console.log('   📦 请求体已解析')
  })

  // ==================== 转换钩子 ====================
  .onTransform((ctx) => {
    // 可以在此添加通用字段到上下文
    ctx.store.processed = true
  })

  // ==================== 处理前钩子 (认证、限流等) ====================
  .onBeforeHandle((ctx) => {
    const { request, store, set } = ctx
    
    // 记录路径
    const path = new URL(request.url).pathname
    store.requestPath = path
    
    // 示例：对所有请求添加自定义 header
    set.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 示例：检查特殊 header (模拟认证)
    const authHeader = request.headers.get('x-api-key')
    if (path.startsWith('/api/secure') && authHeader !== 'secret-key') {
      set.status = 403
      return {
        success: false,
        error: '无效的 API Key'
      }
    }
    
    console.log('   🔍 请求验证通过')
  })

  // ==================== 处理后钩子 ====================
  .onAfterHandle((ctx, response) => {
    const { store, request } = ctx
    const duration = Date.now() - (store.requestStartTime as number)
    
    console.log(`   ✅ 响应时间：${duration}ms`)
    console.log(`   📤 响应状态：${response instanceof Response ? response.status : 200}`)
    
    // 记录请求日志
    requestLog.push({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: store.requestPath,
      duration,
      status: response instanceof Response ? response.status : 200
    })
    
    // 示例：在响应中添加性能 header
    if (response && typeof response === 'object' && !(response instanceof Response)) {
      return {
        ...response,
        _meta: {
          duration: `${duration}ms`,
          requestId: (response as any)._meta?.requestId
        }
      }
    }
  })

  // ==================== 错误处理钩子 ====================
  .onError((ctx, error) => {
    const { request, set } = ctx
    
    console.error(`   ❌ 错误：${error.message}`)
    console.error(`   堆栈：${error.stack}`)
    
    set.status = 500
    set.headers['X-Error-Type'] = error.name
    
    return {
      success: false,
      error: {
        type: error.name,
        message: error.message,
        path: new URL(request.url).pathname,
        timestamp: new Date().toISOString()
      }
    }
  })

  // ==================== 路由定义 ====================
  .get('/', () => ({
    message: '生命周期钩子示例',
    totalRequests: requestCount,
    endpoints: {
      public: '/api/public',
      secure: '/api/secure/data (需要 x-api-key: secret-key)',
      error: '/error/test'
    }
  }))

  // 公开 API (不需要认证)
  .get('/api/public', () => ({
    success: true,
    message: '这是公开接口',
    data: {
      info: '不需要认证即可访问'
    }
  }))

  // 安全 API (需要 API Key)
  .get('/api/secure/data', () => ({
    success: true,
    message: '认证成功',
    data: {
      secretData: '这是受保护的数据',
      accessedAt: new Date().toISOString()
    }
  }))

  // 错误测试端点
  .get('/error/test', () => {
    throw new Error('这是一个测试错误')
  })

  // 获取请求日志
  .get('/logs', () => ({
    success: true,
    totalRequests: requestCount,
    recentLogs: requestLog.slice(-10).reverse()
  }))

  // 自定义 404 处理
  .onNotFound((ctx) => {
    const { request, set } = ctx
    
    set.status = 404
    set.headers['Content-Type'] = 'application/json'
    
    return {
      success: false,
      error: '未找到资源',
      path: new URL(request.url).pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
      hint: '请检查 URL 是否正确'
    }
  })

  // ==================== 服务器停止钩子 ====================
  .onStop(() => {
    console.log('\n🛑 服务器正在停止...')
    console.log(`📊 总请求数：${requestCount}`)
    console.log('⏰ 停止时间:', new Date().toISOString())
  })

  .listen(3012)

console.log('🔗 生命周期钩子服务运行在 http://localhost:3012')
console.log('📖 测试端点:')
console.log('   GET / - 首页')
console.log('   GET /api/public - 公开接口')
console.log('   GET /api/secure/data - 安全接口 (需 x-api-key: secret-key)')
console.log('   GET /error/test - 触发错误')
console.log('   GET /logs - 查看请求日志')
console.log('   GET /nonexistent - 触发 404')
console.log('')
console.log('💡 测试命令:')
console.log('   curl http://localhost:3012/api/secure/data -H "x-api-key: secret-key"')
console.log('   curl http://localhost:3012/error/test')
console.log('   curl http://localhost:3012/logs')

export type HooksApp = typeof app
