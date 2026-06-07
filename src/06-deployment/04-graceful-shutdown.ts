/**
 * Level 4 - 部署专题：优雅关闭
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 掌握容器化部署
 * 2. ✅ 配置健康检查
 * 3. ✅ K8s 兼容配置
 * 4. ✅ 优雅关闭服务
 * 5. ✅ 使用 PM2 管理
 * 
 * ⚠️ 注意事项：
 * - 生产环境用 HTTPS
 * - 配置环境变量
 * - Docker 需要准备
 * - 监控日志输出
 * 
 * 📝 练习任务：
 * - 添加 Redis 断开
 * - 添加消息队列清理
 * - 实现超时强制退出
 * 
 * 🔗 相关文档：
 * - deployment/01-DEPLOYMENT.md - 部署指南
 * - docs/12-GITHUB_ACTIONS_DEPLOY_GUIDE.md - GitHub Actions
 * 
 * 运行：bun run src/06-deployment/04-graceful-shutdown.ts
 */

import { Elysia } from 'elysia'

// 模拟数据库连接池
class DatabasePool {
  private connected = false
  private connections: number = 0

  async connect() {
    console.log('📦 连接数据库...')
    await new Promise(resolve => setTimeout(resolve, 100))
    this.connected = true
    this.connections = 10
    console.log('✅ 数据库已连接，连接池大小:', this.connections)
  }

  async disconnect() {
    console.log('📦 断开数据库连接...')
    await new Promise(resolve => setTimeout(resolve, 200))
    this.connected = false
    this.connections = 0
    console.log('✅ 数据库已断开')
  }

  getStatus() {
    return {
      connected: this.connected,
      connections: this.connections
    }
  }
}

// 模拟 Redis 连接
class RedisClient {
  private connected = false

  async connect() {
    console.log('📦 连接 Redis...')
    await new Promise(resolve => setTimeout(resolve, 50))
    this.connected = true
    console.log('✅ Redis 已连接')
  }

  async disconnect() {
    console.log('📦 断开 Redis 连接...')
    await new Promise(resolve => setTimeout(resolve, 100))
    this.connected = false
    console.log('✅ Redis 已断开')
  }

  getStatus() {
    return { connected: this.connected }
  }
}

// 初始化资源
const db = new DatabasePool()
const redis = new RedisClient()

// 创建应用
const app = new Elysia()
  // 健康检查
  .get('/health', () => ({ status: 'ok' }))
  
  // 模拟长时间运行的请求
  .get('/slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { message: '慢请求完成' }
  })
  
  // 后台任务
  .get('/background', async () => {
    // 模拟后台任务
    setTimeout(() => {
      console.log('🔄 后台任务执行中...')
    }, 5000)
    return { message: '后台任务已启动' }
  })
  
  // 启动时连接资源
  .onListen(async () => {
    await db.connect()
    await redis.connect()
    console.log('🚀 应用已启动')
  })

// 启动服务器
const server = app.listen(3000)

console.log('🌟 服务器运行在 http://localhost:3000')
console.log('📋 测试端点:')
console.log('   GET /health       - 健康检查')
console.log('   GET /slow         - 慢请求 (2 秒)')
console.log('   GET /background   - 后台任务')
console.log('')
console.log('🛑 按 Ctrl+C 停止应用，观察优雅关闭过程')

// ==================== 优雅关闭处理 ====================

let isShuttingDown = false

// 关闭函数
async function shutdown(signal: string) {
  if (isShuttingDown) {
    console.log('⚠️ 已在关闭过程中，忽略重复信号')
    return
  }
  
  isShuttingDown = true
  
  console.log('')
  console.log(`🛑 收到退出信号: ${signal}`)
  console.log('🛑 开始优雅关闭...')
  
  // 1. 停止接收新请求
  console.log('⏸️ 停止接收新请求...')
  
  // 2. 等待活跃请求完成 (最多等待 10 秒)
  console.log('⏳ 等待活跃请求完成...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 3. 关闭数据库连接
  await db.disconnect()
  
  // 4. 关闭 Redis 连接
  await redis.disconnect()
  
  // 5. 关闭 HTTP 服务器
  console.log('🛑 关闭 HTTP 服务器...')
  server.stop(() => {
    console.log('✅ HTTP 服务器已关闭')
  })
  
  // 6. 清理其他资源
  console.log('🧹 清理其他资源...')
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log('✅ 优雅关闭完成')
  console.log('👋 再见!')
  
  // 退出进程
  process.exit(0)
}

// 注册退出信号处理

// Ctrl+C (SIGINT)
process.on('SIGINT', () => shutdown('SIGINT'))

// 系统终止 (SIGTERM)
process.on('SIGTERM', () => shutdown('SIGTERM'))

// 未捕获异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error)
  shutdown('uncaughtException')
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason)
  shutdown('unhandledRejection')
})

// 进程退出
process.on('exit', (code) => {
  console.log(`🏁 进程退出，代码：${code}`)
})

export default app
