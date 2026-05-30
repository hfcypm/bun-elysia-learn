/**
 * 限流中间件示例
 * 知识点：请求频率限制、IP 识别、窗口计数
 * 运行：npx tsx examples/03-middleware/ratelimit.ts
 */

import { Elysia } from 'elysia'

// 限流配置
interface RateLimitConfig {
  windowMs: number    // 时间窗口 (毫秒)
  maxRequests: number // 最大请求数
  message: string     // 超限提示
}

const configs = {
  // 全局限流：每分钟 60 次
  global: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: '请求过于频繁，请稍后再试'
  } as RateLimitConfig,
  
  // 严格限流：每分钟 10 次
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '操作过于频繁，请放慢速度'
  } as RateLimitConfig,
  
  // 宽松限流：每分钟 100 次
  loose: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: '请求过多'
  } as RateLimitConfig,
  
  // API 限流：每秒 5 次
  api: {
    windowMs: 1000,
    maxRequests: 5,
    message: 'API 调用过于频繁'
  } as RateLimitConfig
}

// 请求计数器
const requestCounts = new Map<string, {
  count: number
  resetTime: number
  firstRequestTime: number
}>()

// 清理过期记录的定时器
setInterval(() => {
  const now = Date.now()
  let deleted = 0
  
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
      deleted++
    }
  }
  
  if (deleted > 0) {
    console.log(`[RateLimit] 清理了 ${deleted} 条过期记录`)
  }
}, 60 * 1000)

// 限流中间件工厂
function createRateLimiter(config: RateLimitConfig) {
  return ({ request, set }: any) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    let record = requestCounts.get(ip)
    
    // 新 IP 或超过时间窗口
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequestTime: now
      }
      requestCounts.set(ip, record)
      
      set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
      set.headers['X-RateLimit-Remaining'] = (config.maxRequests - 1).toString()
      set.headers['X-RateLimit-Reset'] = new Date(record.resetTime).toISOString()
      
      return { rateLimit: true }
    }
    
    // 在时间窗口内
    record.count++
    
    const remaining = Math.max(0, config.maxRequests - record.count)
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    
    set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
    set.headers['X-RateLimit-Remaining'] = remaining.toString()
    set.headers['X-RateLimit-Reset'] = new Date(record.resetTime).toISOString()
    
    // 超过限制
    if (record.count > config.maxRequests) {
      set.status = 429
      set.headers['Retry-After'] = retryAfter.toString()
      
      return {
        rateLimit: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: config.message,
          retryAfter: retryAfter,
          retryAfterText: `${retryAfter}秒后重试`
        }
      }
    }
    
    return { rateLimit: true }
  }
}

const app = new Elysia()
  // 全局限流中间件
  .derive(createRateLimiter(configs.global))

  // 公开接口
  .get('/', () => {
    return {
      message: '欢迎使用限流服务',
      tip: '快速刷新页面测试限流效果'
    }
  })

  // 查看限流状态
  .get('/rate-limit-status', ({ request }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const record = requestCounts.get(ip)
    
    return {
      ip,
      currentCount: record?.count || 0,
      resetTime: record ? new Date(record.resetTime).toISOString() : null,
      config: {
        windowMs: configs.global.windowMs,
        maxRequests: configs.global.maxRequests
      }
    }
  })

  // 使用路由组应用不同的限流策略
  .group('/api/strict', app => app
    .derive(createRateLimiter(configs.strict))
    .get('/data', () => {
      return {
        data: '严格限流的数据',
        limit: '10 次/分钟'
      }
    })
  )

  // 宽松限流的接口
  .group('/api/loose', app => app
    .derive(createRateLimiter(configs.loose))
    .get('/data', () => {
      return {
        data: '宽松限流的数据',
        limit: '100 次/分钟'
      }
    })
  )

  // 严格限流测试接口
  .get('/api/strict/test', ({ request, set }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const record = requestCounts.get(ip)
    
    return {
      message: '严格限流测试接口',
      config: configs.strict,
      yourRequests: record?.count || 0,
      tip: '快速刷新，超过 10 次会被限流'
    }
  })

  // 查看统计数据
  .get('/admin/rate-limit-stats', () => {
    let totalIps = requestCounts.size
    let blockedRequests = 0
    
    return {
      totalActiveIps: totalIps,
      configs,
      cleaningInterval: '每分钟清理过期记录'
    }
  })

app.listen(3303, () => {
  console.log('🚀 服务器运行在 http://localhost:3303')
  console.log('\n📝 限流配置:')
  console.log('   全局限流：60 次/分钟')
  console.log('   严格限流：10 次/分钟 (/api/strict/*)')
  console.log('   宽松限流：100 次/分钟 (/api/loose/*)')
  console.log('\n📝 测试接口:')
  console.log('   GET /                      - 公开接口')
  console.log('   GET /rate-limit-status     - 查看限流状态')
  console.log('   GET /api/strict/test       - 严格限流测试')
  console.log('   GET /api/strict/data       - 严格限流数据')
  console.log('   GET /api/loose/data        - 宽松限流数据')
  console.log('   GET /admin/rate-limit-stats - 查看统计')
  console.log('\n💡 测试方法:')
  console.log('   1. 打开 /api/strict/test')
  console.log('   2. 快速连续刷新 (F5) 10 次以上')
  console.log('   3. 观察是否返回 429 Too Many Requests')
  console.log('   4. 查看响应头的 X-RateLimit-* 字段')
})
