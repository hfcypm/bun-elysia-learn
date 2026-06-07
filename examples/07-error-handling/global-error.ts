/**
 * 示例片段: Global Error
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

import { Elysia, t } from 'elysia'

// 自定义错误类
class AppError extends Error {
  code: string
  status: number
  details?: any

  constructor(message: string, code: string, status: number, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} 不存在`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

// 错误日志
const errorLog: any[] = []

const app = new Elysia()
  // 全局错误处理
  .onError(({ request, error, set }) => {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      path: new URL(request.url).pathname,
      method: request.method,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    errorLog.push(errorEntry)
    console.error('❌ 错误:', errorEntry)

    // 处理自定义 AppError
    if (error instanceof AppError) {
      set.status = error.status
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: errorEntry.timestamp
        }
      }
    }

    // 处理验证错误 (Elysia 内置)
    if (error.name === 'ValidationError') {
      set.status = 400
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '请求数据验证失败',
          details: (error as any).errors || error.message,
          timestamp: errorEntry.timestamp
        }
      }
    }

    // 其他错误 (服务器内部错误)
    set.status = 500
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? '服务器内部错误' 
          : error.message,
        timestamp: errorEntry.timestamp,
        hint: '请稍后重试或联系技术支持'
      }
    }
  })

  // 全局 404 处理
  .onNotFound(({ request, set }) => {
    set.status = 404
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '请求的资源不存在',
        path: new URL(request.url).pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        hints: [
          '检查 URL 拼写是否正确',
          '查看 API 文档确认端点',
          '联系技术支持获取帮助'
        ]
      }
    }
  })

  // ==================== 测试端点 ====================
  .get('/', () => ({
    message: '错误处理示例',
    endpoints: {
      validation: '/error/validation - 验证错误',
      notFound: '/error/notfound/:id - 资源不存在',
      unauthorized: '/error/unauthorized - 未授权',
      custom: '/error/custom - 自定义错误',
      unknown: '/error/unknown - 未知错误',
      logs: '/error/logs - 查看错误日志'
    }
  }))

  // 验证错误示例
  .post('/error/validation', ({ body, set }) => {
    const { email, age, password } = body

    const errors: string[] = []

    // 邮箱验证
    if (!email || !email.includes('@')) {
      errors.push('邮箱格式不正确')
    }

    // 年龄验证
    if (!age || age < 18 || age > 120) {
      errors.push('年龄必须在 18-120 之间')
    }

    // 密码验证
    if (!password || password.length < 8) {
      errors.push('密码长度至少 8 位')
    }

    if (errors.length > 0) {
      throw new ValidationError('数据验证失败', {
        fields: errors
      })
    }

    return {
      success: true,
      message: '验证通过'
    }
  }, {
    body: t.Object({
      email: t.String(),
      age: t.Number(),
      password: t.String()
    })
  })

  // 资源不存在示例
  .get('/error/notfound/:id', ({ params }) => {
    const { id } = params
    
    // 模拟数据库查询
    const resource = null // 假设没找到
    
    if (!resource) {
      throw new NotFoundError(`资源 ${id}`)
    }

    return { success: true, data: resource }
  })

  // 未授权示例
  .get('/error/unauthorized', ({ request, set }) => {
    const token = request.headers.get('authorization')
    
    if (!token || token !== 'Bearer valid-token') {
      throw new UnauthorizedError(
        token ? 'Token 无效' : '请提供 Authorization header'
      )
    }

    return { success: true, message: '认证成功' }
  })

  // 自定义错误示例
  .get('/error/custom', () => {
    throw new AppError(
      '业务逻辑错误',
      'BUSINESS_ERROR',
      400,
      {
        reason: '库存不足',
        available: 5,
        required: 10
      }
    )
  })

  // 未知错误示例
  .get('/error/unknown', () => {
    // 模拟未知错误
    throw new Error('这是一个未知的系统错误')
  })

  // 查看错误日志
  .get('/error/logs', () => ({
    success: true,
    totalErrors: errorLog.length,
    recentErrors: errorLog.slice(-20).reverse(),
    errorsByType: {
      AppError: errorLog.filter(e => e.error.name === 'AppError').length,
      ValidationError: errorLog.filter(e => e.error.name === 'ValidationError').length,
      NotFoundError: errorLog.filter(e => e.error.name === 'NotFoundError').length,
      UnauthorizedError: errorLog.filter(e => e.error.name === 'UnauthorizedError').length,
      Other: errorLog.filter(e => !['AppError', 'ValidationError', 'NotFoundError', 'UnauthorizedError'].includes(e.error.name)).length
    }
  }))

  // 清除错误日志
  .post('/error/logs/clear', () => {
    errorLog.length = 0
    return {
      success: true,
      message: '错误日志已清除'
    }
  })

  .listen(3014)

console.log('⚠️ 错误处理服务运行在 http://localhost:3014')
console.log('📖 测试端点:')
console.log('   GET  / - 首页')
console.log('   POST /error/validation - 验证错误 (发送无效数据)')
console.log('   GET  /error/notfound/123 - 资源不存在')
console.log('   GET  /error/unauthorized - 未授权访问')
console.log('   GET  /error/custom - 自定义错误')
console.log('   GET  /error/unknown - 未知错误')
console.log('   GET  /error/logs - 查看错误日志')
console.log('   POST /error/logs/clear - 清除错误日志')
console.log('')
console.log('💡 测试命令:')
console.log('   curl http://localhost:3014/error/notfound/123')
console.log('   curl -X POST http://localhost:3014/error/validation -H "Content-Type: application/json" -d \'{"email":"invalid","age":10,"password":"123"}\'')

export type ErrorHandlingApp = typeof app
