/**
 * 环境变量与配置管理
 * 
 * 学习目标:
 * - 使用 dotenv 管理环境变量
 * - 配置验证
 * - 多环境配置
 * - 敏感信息管理
 * 
 * 安装依赖:
 * bun install dotenv
 */

import { Elysia, t } from 'elysia'
import { existsSync } from 'fs'
import { join } from 'path'

// 加载环境变量
if (existsSync(join(process.cwd(), '.env'))) {
  import('dotenv').then(dotenv => dotenv.config())
  console.log('✅ .env 文件已加载')
} else {
  console.log('⚠️ 未找到 .env 文件，使用默认配置')
}

// ==================== 配置验证 ====================
interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test'
  port: number
  host: string
  jwtSecret: string
  databaseUrl: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  corsOrigins: string[]
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

// 配置验证函数
function validateConfig(): AppConfig {
  const errors: string[] = []
  
  // 获取环境变量
  const nodeEnv = process.env.NODE_ENV as AppConfig['nodeEnv'] || 'development'
  const port = parseInt(process.env.PORT || '3017')
  const host = process.env.HOST || '0.0.0.0'
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production'
  const databaseUrl = process.env.DATABASE_URL || 'sqlite://./data.sqlite'
  const logLevel = process.env.LOG_LEVEL as AppConfig['logLevel'] || 'info'
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
  
  // 验证必填项
  if (!process.env.JWT_SECRET && nodeEnv === 'production') {
    errors.push('生产环境必须设置 JWT_SECRET')
  }
  
  if (port < 1 || port > 65535) {
    errors.push('PORT 必须在 1-65535 之间')
  }
  
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV 必须是 development, production 或 test')
  }
  
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    errors.push('LOG_LEVEL 必须是 debug, info, warn 或 error')
  }
  
  // 验证失败时抛出错误
  if (errors.length > 0) {
    console.error('❌ 配置验证失败:')
    errors.forEach(err => console.error(`   - ${err}`))
    
    if (nodeEnv === 'production') {
      throw new Error('生产环境配置验证失败')
    }
  }
  
  // 返回验证后的配置
  const config: AppConfig = {
    nodeEnv,
    port,
    host,
    jwtSecret,
    databaseUrl,
    logLevel,
    corsOrigins,
    rateLimit: process.env.RATE_LIMIT_WINDOW_MS && process.env.RATE_LIMIT_MAX_REQUESTS ? {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    } : undefined
  }
  
  // 打印配置信息 (不打印敏感信息)
  console.log('📋 当前配置:')
  console.log(`   环境：${config.nodeEnv}`)
  console.log(`   端口：${config.port}`)
  console.log(`   主机：${config.host}`)
  console.log(`   日志级别：${config.logLevel}`)
  console.log(`   CORS 来源：${config.corsOrigins.join(', ')}`)
  console.log(`   JWT Secret: ${config.jwtSecret === 'default-secret-key-change-in-production' ? '⚠️ 使用默认值 (不安全)' : '✅ 已设置'}`)
  
  return config
}

const config = validateConfig()

// ==================== 日志工具 ====================
const logger = {
  level: config.logLevel,
  
  log(level: string, message: string, data?: any) {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.level)
    const messageLevelIndex = levels.indexOf(level)
    
    if (messageLevelIndex < currentLevelIndex) {
      return // 跳过低于当前日志级别的消息
    }
    
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
      env: config.nodeEnv
    }
    
    // 生产环境使用 JSON 格式，开发环境使用彩色输出
    if (config.nodeEnv === 'production') {
      console.log(JSON.stringify(logEntry))
    } else {
      const colors: Record<string, string> = {
        debug: '\x1b[36m', // 青色
        info: '\x1b[32m',  // 绿色
        warn: '\x1b[33m',  // 黄色
        error: '\x1b[31m'  // 红色
      }
      const reset = '\x1b[0m'
      const color = colors[level] || ''
      
      console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`)
      if (data) {
        console.log(data)
      }
    }
  },
  
  debug(message: string, data?: any) {
    this.log('debug', message, data)
  },
  
  info(message: string, data?: any) {
    this.log('info', message, data)
  },
  
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  },
  
  error(message: string, data?: any) {
    this.log('error', message, data)
  }
}

// ==================== API 定义 ====================
const app = new Elysia()
  // 首页
  .get('/', () => ({
    message: '环境变量与配置管理示例',
    environment: config.nodeEnv,
    endpoints: {
      config: '/config - 查看当前配置',
      health: '/health - 健康检查',
      env: '/env - 环境变量列表 (脱敏)',
      logger: '/logger/test - 测试日志'
    }
  }))

  // 查看配置 (脱敏)
  .get('/config', () => ({
    success: true,
    config: {
      nodeEnv: config.nodeEnv,
      port: config.port,
      host: config.host,
      logLevel: config.logLevel,
      corsOrigins: config.corsOrigins,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      rateLimit: config.rateLimit
    }
  }))

  // 健康检查
  .get('/health', () => {
    logger.info('健康检查请求')
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptime: process.uptime()
    }
  })

  // 环境变量列表 (脱敏显示)
  .get('/env', () => {
    const envVars = Object.entries(process.env)
      .filter(([key]) => 
        !key.toLowerCase().includes('secret') &&
        !key.toLowerCase().includes('password') &&
        !key.toLowerCase().includes('token') &&
        !key.toLowerCase().includes('key') &&
        !key.toLowerCase().includes('private')
      )
      .map(([key, value]) => ({
        key,
        value: value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : undefined,
        isSet: value !== undefined
      }))
      .sort((a, b) => a.key.localeCompare(b.key))

    return {
      success: true,
      count: envVars.length,
      data: envVars
    }
  })

  // 测试日志
  .get('/logger/test', () => {
    logger.debug('这是一条调试消息', { detail: '详细信息' })
    logger.info('这是一条信息消息', { user: 'test' })
    logger.warn('这是一条警告消息', { warning: '需要注意' })
    logger.error('这是一条错误消息', { error: '测试错误' })
    
    return {
      success: true,
      message: '日志已输出，请查看控制台',
      tip: '调整 LOG_LEVEL 环境变量来控制日志输出级别'
    }
  })

  // 模拟业务接口
  .get('/api/data', () => {
    logger.debug('获取数据', { query: 'all' })
    
    return {
      success: true,
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 100
      }))
    }
  })

  // 模拟需要认证的操作
  .post('/api/action', ({ set }) => {
    logger.info('执行操作')
    
    if (!process.env.JWT_SECRET || config.jwtSecret === 'default-secret-key-change-in-production') {
      set.status = 503
      return {
        success: false,
        error: '服务配置不完整',
        message: '生产环境请设置 JWT_SECRET'
      }
    }
    
    return {
      success: true,
      message: '操作执行成功',
      timestamp: new Date().toISOString()
    }
  })

  // 配置检查
  .get('/config/check', () => {
    const checks = {
      jwtSecret: {
        name: 'JWT_SECRET',
        required: config.nodeEnv === 'production',
        status: process.env.JWT_SECRET && config.jwtSecret !== 'default-secret-key-change-in-production' ? '✅' : config.nodeEnv === 'production' ? '❌' : '⚠️'
      },
      databaseUrl: {
        name: 'DATABASE_URL',
        required: true,
        status: process.env.DATABASE_URL ? '✅' : '❌'
      },
      port: {
        name: 'PORT',
        required: false,
        status: process.env.PORT ? '✅' : 'ℹ️ (使用默认值)'
      },
      nodeEnv: {
        name: 'NODE_ENV',
        required: false,
        status: process.env.NODE_ENV ? '✅' : 'ℹ️ (development)'
      },
      logLevel: {
        name: 'LOG_LEVEL',
        required: false,
        status: process.env.LOG_LEVEL ? '✅' : 'ℹ️ (info)'
      },
      corsOrigins: {
        name: 'CORS_ORIGINS',
        required: config.nodeEnv === 'production',
        status: process.env.CORS_ORIGINS ? '✅' : config.nodeEnv === 'production' ? '❌' : 'ℹ️'
      }
    }

    const allPassed = Object.values(checks).every(check => 
      !check.required || check.status === '✅'
    )

    return {
      success: allPassed,
      environment: config.nodeEnv,
      checks,
      summary: allPassed ? '配置检查通过' : '存在配置问题，请检查'
    }
  })

  .listen(config.port, config.host)

console.log(`🚀 服务已启动：http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`)
console.log('📖 测试端点:')
console.log('   GET / - 首页')
console.log('   GET /config - 查看配置')
console.log('   GET /health - 健康检查')
console.log('   GET /env - 环境变量列表')
console.log('   GET /logger/test - 测试日志')
console.log('   GET /config/check - 配置检查')
console.log('')
console.log('💡 创建 .env 文件示例:')
console.log('   NODE_ENV=development')
console.log('   PORT=3017')
console.log('   JWT_SECRET=your-secret-key-here')
console.log('   DATABASE_URL=sqlite://./data.sqlite')
console.log('   LOG_LEVEL=debug')
console.log('   CORS_ORIGINS=http://localhost:3000,http://localhost:8080')

export type EnvConfigApp = typeof app
