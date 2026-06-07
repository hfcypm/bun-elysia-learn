/**
 * Level 3 - 练习案例：Rate Limit
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 独立完成Rate Limit的开发
 * 2. ✅ 应用前面学到的所有知识
 * 3. ✅ 练习代码组织和模块化
 * 4. ✅ 培养调试和问题解决能力
 * 5. ✅ 对比参考答案优化代码
 * 
 * ⚠️ 注意事项：
 * - 先理解需求再 coding
 * - 参考已学案例的实现
 * - 遇到困难先查阅文档
 * - 完成后对比参考答案
 * - 注意代码质量
 * 
 * 📝 练习任务：
 * - 完成所有功能需求
 * - 添加额外的特性
 * - 编写完整测试用例
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * - docs/06-PRACTICE.md - 练习手册
 * 
 * 运行：bun run src/04-practice/03-rate-limit.ts
 */

import { Elysia, t } from 'elysia'

// 限流配置
interface RateLimitConfig {
  windowMs: number  // 时间窗口 (毫秒)
  maxRequests: number  // 最大请求数
  message: string  // 超限消息
}

// 请求记录
interface RequestRecord {
  timestamps: number[]
  count: number
}

// 内存存储: IP -> 请求记录
const requestStore = new Map<string, RequestRecord>()

// 创建限流中间件
function rateLimit(config: RateLimitConfig) {
  return new Elysia({
    name: 'rate-limit',
    seed: config
  })
    .onBeforeHandle(({ request, set }) => {
      // 获取客户端 IP (真实环境中应从 X-Forwarded-For 或 X-Real-IP 获取)
      const ip = '127.0.0.1' // 演示用固定 IP
      
      const now = Date.now()
      const windowStart = now - config.windowMs
      
      // 获取或创建请求记录
      let record = requestStore.get(ip)
      
      if (!record) {
        record = { timestamps: [], count: 0 }
        requestStore.set(ip, record)
      }
      
      // 清理过期请求
      record.timestamps = record.timestamps.filter(ts => ts > windowStart)
      record.count = record.timestamps.length
      
      // 检查是否超限
      if (record.count >= config.maxRequests) {
        const oldestTimestamp = Math.min(...record.timestamps)
        const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000)
        
        set.status = 429
        set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
        set.headers['X-RateLimit-Remaining'] = '0'
        set.headers['X-RateLimit-Reset'] = Math.ceil((oldestTimestamp + config.windowMs) / 1000).toString()
        set.headers['Retry-After'] = retryAfter.toString()
        
        return {
          success: false,
          error: config.message,
          retryAfter
        }
      }
      
      // 记录当前请求
      record.timestamps.push(now)
      record.count++
      
      // 设置限流响应头
      set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
      set.headers['X-RateLimit-Remaining'] = (config.maxRequests - record.count).toString()
      set.headers['X-RateLimit-Reset'] = Math.ceil((now + config.windowMs) / 1000).toString()
    })
}

// 清理过期数据的定时任务 (每 5 分钟执行一次)
setInterval(() => {
  const now = Date.now()
  const maxWindow = 60 * 60 * 1000 // 最长窗口 1 小时
  
  for (const [ip, record] of requestStore.entries()) {
    record.timestamps = record.timestamps.filter(ts => ts > now - maxWindow)
    if (record.timestamps.length === 0) {
      requestStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

const app = new Elysia()
  // 全局限流：每秒最多 10 次请求
  .use(rateLimit({
    windowMs: 1000,
    maxRequests: 10,
    message: '请求过于频繁，请稍后再试'
  }))
  
  // 严格的 API 限流：每秒最多 2 次请求
  .group('/api/strict', app => app
    .use(rateLimit({
      windowMs: 1000,
      maxRequests: 2,
      message: '严格限流接口，每秒最多 2 次请求'
    }))
    .get('/resource', () => {
      return {
        success: true,
        message: '这是受严格限制的 API',
        timestamp: new Date().toISOString()
      }
    })
  )
  
  // 宽松的 API 限流：每分钟最多 60 次请求
  .group('/api/relaxed', app => app
    .use(rateLimit({
      windowMs: 60 * 1000,
      maxRequests: 60,
      message: '宽松限流接口，每分钟最多 60 次请求'
    }))
    .get('/resource', () => {
      return {
        success: true,
        message: '这是受宽松限制的 API',
        timestamp: new Date().toISOString()
      }
    })
  )
  
  // 基础 API 端点
  .get('/api/public', () => {
    return {
      success: true,
      message: '公共 API',
      timestamp: new Date().toISOString()
    }
  })
  
  // 查看限流状态
  .get('/rate-limit-status', () => {
    const ip = '127.0.0.1'
    const record = requestStore.get(ip)
    
    return {
      success: true,
      currentRequests: record?.count || 0,
      activeWindows: Array.from(requestStore.keys()).length
    }
  })
  
  // 重置限流 (开发调试用)
  .post('/rate-limit-reset', () => {
    requestStore.clear()
    return {
      success: true,
      message: '限流数据已重置'
    }
  })
  
  .listen(3004)

console.log('🚦 API 限流服务运行在 http://localhost:3004')
console.log('📖 测试端点:')
console.log('   GET /api/public - 公共 API (每秒 10 次)')
console.log('   GET /api/strict/resource - 严格限流 API (每秒 2 次)')
console.log('   GET /api/relaxed/resource - 宽松限流 API (每分钟 60 次)')
console.log('   GET /rate-limit-status - 查看限流状态')
console.log('   POST /rate-limit-reset - 重置限流数据')
console.log('💡 提示：使用以下命令快速测试限流')
console.log('   for i in {1..5}; do curl http://localhost:3004/api/strict/resource; done')

export type RateLimitApp = typeof app
