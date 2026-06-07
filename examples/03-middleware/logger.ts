/**
 * 示例片段: Logger
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习中间件的具体用法
 * 2. ✅ 理解中间件的执行流程
 * 3. ✅ 参考实现自己的中间件
 * 4. ✅ 组合多个中间件
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3300，被占用请修改
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
 * 运行：bun run examples/03-middleware/logger.ts
 * 测试：http://localhost:3300
 */

import { Elysia } from 'elysia'

// 模拟数据库
let requestCount = 0
const slowRequests: Array<{ path: string; method: string; duration: number; time: string }> = []

const app = new Elysia()
  // 全局请求日志中间件
  .onRequest(({ request }) => {
    requestCount++
    const start = Date.now()
    const url = new URL(request.url)
    
    // 记录请求开始时间
    console.log(`[${new Date().toISOString()}] #${requestCount}`)
    console.log(`  ${request.method} ${url.pathname}${url.search}`)
    
    // 将开始时间存储到响应中
    return { startTime: start }
  })
  
  // 响应后记录耗时
  .onAfterHandle(({ request, response, set }) => {
    const startTime = set.headers['X-Request-Start'] as unknown as number
    if (startTime) {
      const duration = Date.now() - startTime
      const url = new URL(request.url)
      
      // 记录慢请求
      if (duration > 100) {
        slowRequests.push({
          path: url.pathname,
          method: request.method,
          duration,
          time: new Date().toISOString()
        })
        
        // 只保留最近 100 条慢请求
        if (slowRequests.length > 100) {
          slowRequests.shift()
        }
      }
      
      // 添加响应头
      set.headers['X-Response-Time'] = `${duration}ms`
      
      console.log(`  ✅ ${duration}ms`)
    }
  })

  // 错误日志
  .onError(({ request, error, code }) => {
    const url = new URL(request.url)
    console.error(`  ❌ ${code}: ${error.message}`)
    console.error(`  ${request.method} ${url.pathname}`)
    
    return {
      success: false,
      error: {
        code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }
  })

  // 普通接口
  .get('/', () => {
    return { message: '首页' }
  })

  // 快速接口 (< 10ms)
  .get('/fast', () => {
    return { message: '快速响应', time: Date.now() }
  })

  // 模拟慢接口 (> 100ms)
  .get('/slow', () => {
    // 模拟耗时操作
    const start = Date.now()
    while (Date.now() - start < 150) {
      // 空转
    }
    return { message: '慢速响应', delay: 150 }
  })

  // 模拟不稳定接口
  .get('/random', () => {
    const delay = Math.random() * 300
    const start = Date.now()
    while (Date.now() - start < delay) {}
    return { message: '随机延迟', delay }
  })

  // 错误接口
  .get('/error', () => {
    throw new Error('这是一个测试错误')
  })

  // 查看慢请求日志
  .get('/admin/slow-requests', () => {
    return {
      total: slowRequests.length,
      requests: slowRequests.slice(-20) // 最近 20 条
    }
  })

  // 统计数据
  .get('/stats', () => {
    return {
      totalRequests: requestCount,
      slowRequests: slowRequests.length,
      averageSlowDuration: slowRequests.length > 0
        ? Math.round(slowRequests.reduce((sum, r) => sum + r.duration, 0) / slowRequests.length)
        : 0
    }
  })

app.listen(3300, () => {
  console.log('🚀 服务器运行在 http://localhost:3300')
  console.log('📝 测试接口:')
  console.log('   GET /              - 普通接口')
  console.log('   GET /fast          - 快速响应 (<10ms)')
  console.log('   GET /slow          - 慢速响应 (>100ms)')
  console.log('   GET /random        - 随机延迟')
  console.log('   GET /error         - 触发错误')
  console.log('   GET /stats         - 查看统计')
  console.log('   GET /admin/slow-requests - 查看慢请求日志')
  console.log('\n💡 观察控制台输出的请求日志')
})
