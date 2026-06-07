/**
 * Level 2 - 进阶技能: Logging
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

import { Elysia, t } from 'elysia'
import pino from 'pino'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 确保日志目录存在
const LOG_DIR = join(process.cwd(), 'logs')
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true })
}

// 创建 Pino 日志实例
const logger = pino({
  // 开发环境使用 pretty 输出
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  },
  
  // 日志级别
  level: process.env.LOG_LEVEL || 'info',
  
  // 基础字段
  base: {
    service: 'elysia-logging-demo',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // 时间戳格式
  timestamp: () => `,"time":"${new Date().toISOString()}"`
})

// 创建文件日志实例 (可选：记录到文件)
const fileLogger = process.env.LOG_TO_FILE === 'true' 
  ? pino({
      level: 'debug',
      name: 'file-logger'
    }, pino.destination({
      dest: join(LOG_DIR, 'app.log'),
      minLength: 4096,
      sync: false
    }))
  : null

const app = new Elysia()
  // 全局请求日志
  .onRequest((ctx) => {
    const { request } = ctx
    const url = new URL(request.url)
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 存储请求开始时间
    ctx.store.requestId = requestId
    ctx.store.startTime = Date.now()
    
    logger.info({
      event: 'request_start',
      requestId,
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }, `⬇️ ${request.method} ${url.pathname}`)
  })

  .onAfterHandle((ctx, response) => {
    const { store, request } = ctx
    const duration = Date.now() - (store.startTime as number)
    const requestId = store.requestId as string
    const url = new URL(request.url)
    
    const logData = {
      event: 'request_complete',
      requestId,
      method: request.method,
      path: url.pathname,
      status: response instanceof Response ? response.status : 200,
      duration,
      durationUnit: 'ms'
    }
    
    // 根据响应时间决定日志级别
    if (duration > 1000) {
      logger.warn(logData, `⚠️ 慢请求：${duration}ms`)
    } else {
      logger.info(logData, `✅ ${request.method} ${url.pathname} - ${duration}ms`)
    }
    
    // 同时记录到文件
    fileLogger?.info(logData)
  })

  .onError((ctx, error) => {
    const { store, request } = ctx
    const duration = Date.now() - (store.startTime as number)
    const requestId = store.requestId as string
    const url = new URL(request.url)
    
    logger.error({
      event: 'request_error',
      requestId,
      method: request.method,
      path: url.pathname,
      duration,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }, `❌ 错误：${error.message}`)
  })

  // ==================== API 端点 ====================
  .get('/', () => ({
    message: '结构化日志系统示例',
    features: [
      'Pino 高性能日志',
      '请求自动记录',
      '性能追踪',
      '文件日志 (可选)'
    ],
    endpoints: {
      info: '/logs/info - 查看日志信息',
      test: '/logs/test - 测试各种日志级别',
      slow: '/logs/slow - 测试慢请求告警',
      error: '/logs/error - 测试错误日志',
      export: '/logs/export - 导出日志 (JSON)'
    }
  }))

  // 查看日志信息
  .get('/logs/info', () => ({
    success: true,
    logger: {
      level: logger.levels.labels[logger.level],
      availableLevels: logger.levels,
      logDir: LOG_DIR,
      fileLogging: fileLogger ? 'enabled' : 'disabled'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      logToFile: process.env.LOG_TO_FILE === 'true'
    }
  }))

  // 测试各种日志级别
  .get('/logs/test', () => {
    logger.trace('这是一条 Trace 日志')
    logger.debug('这是一条 Debug 日志', { detail: '详细信息' })
    logger.info('这是一条 Info 日志', { user: 'test', action: 'test_logging' })
    logger.warn('这是一条 Warning 日志', { warning: '需要注意', suggestion: '建议操作' })
    logger.error('这是一条 Error 日志', { error: 'test_error', code: 'E001' })
    logger.fatal('这是一条 Fatal 日志', { fatal: '严重错误' })
    
    return {
      success: true,
      message: '日志已输出，请查看控制台',
      hint: '调整 LOG_LEVEL 环境变量来控制输出级别 (trace/debug/info/warn/error/fatal)'
    }
  })

  // 测试慢请求
  .get('/logs/slow', async () => {
    const startTime = Date.now()
    
    // 模拟耗时操作
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    logger.info({
      event: 'slow_operation',
      duration: Date.now() - startTime
    }, '慢操作完成')
    
    return {
      success: true,
      message: '这是一个慢请求示例',
      duration: `${Date.now() - startTime}ms`,
      hint: '查看控制台的警告日志'
    }
  })

  // 测试错误日志
  .get('/logs/error', () => {
    try {
      // 模拟错误
      throw new Error('这是一个测试错误')
    } catch (error) {
      logger.error({
        event: 'manual_error',
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        }
      }, '手动记录的错误')
      
      throw error
    }
  })

  // 测试带上下文的日志
  .post('/logs/context', async ({ body }) => {
    const { action, userId, data } = body
    
    logger.child({ userId, action }).info({
      event: 'user_action',
      data
    }, `用户操作：${action}`)
    
    // 模拟业务流程
    logger.child({ userId }).debug('开始处理请求')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    logger.child({ userId }).debug('处理完成')
    
    return {
      success: true,
      message: '操作已记录',
      userId,
      action
    }
  }, {
    body: t.Object({
      action: t.String(),
      userId: t.Number(),
      data: t.Optional(t.Any())
    })
  })

  // 测试多个子日志器
  .get('/logs/sub-logger', () => {
    // 创建子日志器，自动添加上下文
    const dbLogger = logger.child({ component: 'database' })
    const authLogger = logger.child({ component: 'authentication' })
    const apiLogger = logger.child({ component: 'api' })
    
    dbLogger.info('数据库查询', { query: 'SELECT * FROM users', duration: 15 })
    dbLogger.warn('慢查询', { query: 'SELECT * FROM large_table', duration: 2500 })
    
    authLogger.info('用户登录', { userId: 123, success: true })
    authLogger.error('认证失败', { userId: 456, reason: 'invalid_token' })
    
    apiLogger.info('API 调用', { endpoint: '/users', method: 'GET' })
    
    return {
      success: true,
      message: '子日志器测试完成',
      components: ['database', 'authentication', 'api']
    }
  })

  // 导出日志 (模拟)
  .get('/logs/export', () => {
    const mockLogs = [
      { time: new Date().toISOString(), level: 'info', msg: '服务启动' },
      { time: new Date().toISOString(), level: 'info', msg: '请求处理', method: 'GET', path: '/' },
      { time: new Date().toISOString(), level: 'warn', msg: '慢请求', duration: 2500 },
      { time: new Date().toISOString(), level: 'error', msg: '认证失败', userId: 456 }
    ]
    
    return {
      success: true,
      count: mockLogs.length,
      logs: mockLogs,
      format: 'JSON',
      hint: '实际应用中可以从日志文件读取'
    }
  })

  .listen(3018)

console.log('📝 结构化日志服务运行在 http://localhost:3018')
console.log('📖 测试端点:')
console.log('   GET / - 首页')
console.log('   GET /logs/info - 查看日志信息')
console.log('   GET /logs/test - 测试各种日志级别')
console.log('   GET /logs/slow - 测试慢请求告警')
console.log('   GET /logs/error - 测试错误日志')
console.log('   POST /logs/context - 带上下文的日志')
console.log('   GET /logs/sub-logger - 子日志器测试')
console.log('   GET /logs/export - 导出日志')
console.log('')
console.log('💡 环境变量配置:')
console.log('   LOG_LEVEL=debug  # 日志级别 (trace/debug/info/warn/error/fatal)')
console.log('   NODE_ENV=production  # 生产环境使用 JSON 格式')
console.log('   LOG_TO_FILE=true  # 启用文件日志')

export type LoggingApp = typeof app
