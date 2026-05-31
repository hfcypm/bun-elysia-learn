/**
 * 请求响应转换钩子
 * 
 * 学习目标:
 * - 使用 derive 派生值
 * - 使用 decorate 装饰器
 * - 统一响应格式
 */

import { Elysia, t } from 'elysia'

// 定义统一的响应格式
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  version: string
}

// 创建 API 版本插件
const apiVersion = (version: string) => new Elysia({
  name: 'api-version',
  seed: { version }
})
  .onBeforeHandle(({ set }) => {
    set.headers['X-API-Version'] = version
  })

// 创建统一响应格式插件
const uniformResponse = new Elysia({ name: 'uniform-response' })
  .onAfterHandle((ctx, response) => {
    // 如果已经是 Response 对象，跳过
    if (response instanceof Response) {
      return response
    }
    
    // 包装为标准响应格式
    const apiResponse: ApiResponse = {
      success: true,
      data: response as any,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    
    return apiResponse
  })

const app = new Elysia()
  // 使用插件
  .use(apiVersion('1.0.0'))
  .use(uniformResponse)
  
  // derive: 派生值 (在 beforeHandle 之前执行)
  .derive(({ request }) => {
    const url = new URL(request.url)
    const startTime = Date.now()
    
    return {
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestTime: startTime,
      pathname: url.pathname,
      query: Object.fromEntries(url.searchParams)
    }
  })
  
  // decorate: 装饰器 (添加自定义方法到 ctx)
  .decorate('formatResponse', <T>(data: T, success = true) => {
    return {
      success,
      data,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    } as ApiResponse<T>
  })
  
  .get('/', ({ formatResponse }) => formatResponse({
    message: '请求响应转换示例',
    features: [
      '统一响应格式',
      'derive 派生值',
      'decorate 装饰器',
      '自动添加 API 版本 header'
    ]
  }))

  // 使用 derive 值
  .get('/request-info', ({ requestId, requestTime, pathname, query }) => {
    const duration = Date.now() - requestTime
    
    return {
      requestId,
      pathname,
      query,
      processingTime: `${duration}ms`,
      serverTime: new Date().toISOString()
    }
  })

  // 使用装饰器方法 (需要禁用统一响应插件)
  .guard(
    { as: 'global' },
    app => app
      // 这个端点会经过统一响应包装
      .get('/wrapped', () => ({
        message: '这个响应会被自动包装'
      }))
      
      // 手动控制响应格式
      .get('/manual', ({ set, request }) => {
        const response = new Response(JSON.stringify({
          custom: true,
          message: '这是手动控制的响应格式'
        }))
        
        response.headers.set('Content-Type', 'application/json')
        return response
      })
  )

  // 条件性响应包装
  .get('/conditional/:type', ({ params, set }) => {
    const { type } = params
    
    if (type === 'raw') {
      // 返回原始响应 (不包装)
      set.headers['X-Response-Type'] = 'raw'
      return new Response('原始响应内容')
    }
    
    if (type === 'error') {
      set.status = 400
      throw new Error('客户端错误')
    }
    
    // 正常返回 (会被包装)
    return {
      type,
      message: '这个响应会被统一格式包装'
    }
  })

  // POST 示例
  .post('/data', ({ body }) => {
    return {
      received: body,
      processed: true,
      timestamp: new Date().toISOString()
    }
  }, {
    body: t.Object({
      name: t.String(),
      value: t.Number()
    })
  })

  .listen(3013)

console.log('🔄 请求响应转换服务运行在 http://localhost:3013')
console.log('📖 测试端点:')
console.log('   GET / - 首页 (统一响应格式)')
console.log('   GET /request-info - 请求信息 (使用 derive 值)')
console.log('   GET /wrapped - 自动包装的响应')
console.log('   GET /manual - 手动控制的响应')
console.log('   GET /conditional/raw - 原始响应')
console.log('   GET /conditional/error - 触发错误')
console.log('   POST /data - POST 数据')
console.log('')
console.log('💡 注意观察响应头 X-API-Version 和统一的响应格式')

export type TransformApp = typeof app
