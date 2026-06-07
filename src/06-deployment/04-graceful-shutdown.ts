/**
 * Level 4 - 部署专题: Graceful Shutdown
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 理解优雅关闭的意义
 * 2. ✅ 处理 SIGTERM/SIGINT 信号
 * 3. ✅ 清理数据库连接
 * 4. ✅ 完成进行中的请求
 * 5. ✅ 避免数据丢失
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3000，被占用请修改
 * - 生产环境使用 HTTPS
 * - 环境变量配置好再部署
 * - Docker 需要安装 Docker Desktop
 * 
 * 📝 练习任务：
 * - 实际运行部署命令
 * - 修改配置参数
 * - 查看部署日志
 * 
 * 🔗 相关文档：
 * - docs/12-GITHUB_ACTIONS_DEPLOY_GUIDE.md - GitHub Actions 部署
 * - deployment/01-DEPLOYMENT.md - 完整部署指南
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run src/06-deployment/04-graceful-shutdown.ts
 * 测试：http://localhost:3000
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
