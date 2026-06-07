/**
 * Level 4 - 部署专题: Health Check
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 理解 Docker 容器化
 * 2. ✅ 配置 Docker Compose
 * 3. ✅ 实现健康检查
 * 4. ✅ 优雅关闭服务
 * 5. ✅ 使用 PM2 管理进程
 * 
 * ⚠️ 注意事项：
 * - Docker 需要安装 Docker Desktop
 * - 健康检查接口要公开
 * - 注意环境变量配置
 * - 生产环境使用 HTTPS
 * 
 * 📝 练习任务：
 * - 构建 Docker 镜像
 * - 运行容器测试
 * - 配置生产环境
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

// 模拟数据库连接检查
async function checkDatabase(): Promise<{ status: string; message: string }> {
  // 实际项目中替换为真实数据库检查
  try {
    // const result = await db.query('SELECT 1')
    return { status: 'healthy', message: '数据库连接正常' }
  } catch (error) {
    return { status: 'unhealthy', message: '数据库连接失败' }
  }
}

// 模拟 Redis 连接检查
async function checkRedis(): Promise<{ status: string; message: string }> {
  // 实际项目中替换为真实 Redis 检查
  try {
    // const result = await redis.ping()
    return { status: 'healthy', message: 'Redis 连接正常' }
  } catch (error) {
    return { status: 'unhealthy', message: 'Redis 连接失败' }
  }
}

const app = new Elysia()
  // 基础健康检查
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))

  // 详细健康检查
  .get('/health/ready', async () => {
    const [dbStatus, redisStatus] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ])

    const isHealthy = dbStatus.status === 'healthy' && redisStatus.status === 'healthy'

    return {
      status: isHealthy ? 'ready' : 'not_ready',
      checks: {
        database: dbStatus,
        redis: redisStatus
      },
      timestamp: new Date().toISOString()
    }
  })

  // 深度健康检查 (包含资源使用)
  .get('/health/detailed', async () => {
    const [dbStatus, redisStatus] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ])

    // 获取内存使用情况
    const memUsage = process.memoryUsage()
    const memoryInfo = {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100 // MB
    }

    // 获取系统信息
    const cpuUsage = process.cpuUsage()
    
    const isHealthy = dbStatus.status === 'healthy' && redisStatus.status === 'healthy'

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: {
        database: dbStatus,
        redis: redisStatus
      },
      resources: {
        memory: memoryInfo,
        cpu: {
          user: Math.round(cpuUsage.user / 1000 / 1000 * 100) / 100, // ms
          system: Math.round(cpuUsage.system / 1000 / 1000 * 100) / 100 // ms
        }
      },
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime())
      },
      version: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString()
    }
  })

  // 存活检查 (Kubernetes Liveness)
  .get('/health/live', () => ({
    status: 'alive',
    timestamp: new Date().toISOString()
  }))

  // 就绪检查 (Kubernetes Readiness)
  .get('/health/readyz', async ({ set }) => {
    const dbStatus = await checkDatabase()
    
    if (dbStatus.status !== 'healthy') {
      set.status = 503
      return {
        status: 'not_ready',
        checks: {
          database: dbStatus
        }
      }
    }

    return {
      status: 'ready',
      checks: {
        database: dbStatus
      }
    }
  })

  // 启动应用
  .listen(3000, () => {
    console.log('🚀 健康检查服务已启动')
    console.log('📊 健康检查端点:')
    console.log('  GET /health          - 基础健康检查')
    console.log('  GET /health/ready    - 就绪检查')
    console.log('  GET /health/detailed - 详细健康检查')
    console.log('  GET /health/live     - 存活检查')
    console.log('  GET /health/readyz   - Kubernetes 就绪检查')
  })

// 格式化运行时长
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0) parts.push(`${secs}s`)
  
  return parts.join(' ') || '0s'
}

export default app
