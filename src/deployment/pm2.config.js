/**
 * PM2 进程管理配置
 * 
 * 功能:
 * - 多进程管理
 * - 自动重启
 * - 日志管理
 * - 性能监控
 * - 热重载
 * 
 * 使用方法:
 * 1. 安装 PM2: npm install -g pm2
 * 2. 启动应用：pm2 start src/deployment/pm2.config.js
 * 3. 查看状态：pm2 status
 * 4. 查看日志：pm2 logs
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'elysia-app',
      
      // 启动脚本
      script: './src/advanced/bookmark-system.ts',
      
      // 执行 interpreter
      interpreter: 'bun',
      
      // 运行模式
      exec_mode: 'cluster', // cluster 模式 (多进程) 或 fork 模式 (单进程)
      
      // 实例数量 (CPU 核心数)
      instances: 'max',
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      
      // 生产环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      
      // 日志配置
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_file: './logs/combined.log',
      merge_logs: true,
      
      // 自动重启配置
      autorestart: true,
      watch: false, // 生产环境关闭文件监控
      max_memory_restart: '500M', // 内存超限自动重启
      
      // 重启策略
      restart_delay: 4000, // 重启延迟 (毫秒)
      max_restarts: 10, // 最大重启次数
      min_uptime: '10s', // 最小运行时间
      
      // 优雅关闭
      kill_timeout: 3000, // 等待进程关闭超时
      wait_ready: true, // 等待应用就绪
      listen_timeout: 5000, // 监听超时
      
      // 性能优化
      vizion: false, // 关闭版本控制
      autoprefixer: false, // 关闭 CSS 前缀
      
      // 集群配置
      combine_logs: true, // 合并日志
      
      // 监控配置
      max_restarts: 10,
      min_uptime: '10s'
    },
    
    // 后台任务工作进程
    {
      name: 'elysia-worker',
      script: './src/deployment/worker.ts',
      interpreter: 'bun',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/elysia-app.git',
      path: '/var/www/elysia-app',
      'pre-deploy-local': '',
      'post-deploy': 'pm2 startOrRestart src/deployment/pm2.config.js --env production',
      'pre-setup': ''
    }
  }
}

// ==================== PM2 常用命令 ====================
//
// 启动应用:
// pm2 start src/deployment/pm2.config.js
//
// 指定环境启动:
// pm2 start src/deployment/pm2.config.js --env production
//
// 查看状态:
// pm2 status
//
// 查看日志:
// pm2 logs
// pm2 logs elysia-app --lines 100
//
// 重启应用:
// pm2 restart elysia-app
//
// 停止应用:
// pm2 stop elysia-app
//
// 删除应用:
// pm2 delete elysia-app
//
// 查看监控:
// pm2 monit
//
// 查看详细信息:
// pm2 show elysia-app
//
// 保存进程列表:
// pm2 save
//
// 开机自启:
// pm2 startup
// pm2 save
//
// 热重载:
// pm2 reload elysia-app
//
// 扩容:
// pm2 scale elysia-app 4
//
// ==================== 性能调优建议 ====================
//
// 1. 设置合适的实例数 (通常等于 CPU 核心数)
// 2. 配置 max_memory_restart 防止内存泄漏
// 3. 启用集群模式提高并发能力
// 4. 配置日志轮转防止日志过大
// 5. 监控 CPU 和内存使用情况
