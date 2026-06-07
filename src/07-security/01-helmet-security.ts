/**
 * Level 4 - 安全专题: Helmet Security
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 理解 OWASP Top 10
 * 2. ✅ 配置安全响应头
 * 3. ✅ 防止常见攻击
 * 4. ✅ 保护敏感数据
 * 
 * ⚠️ 注意事项：
 * - 生产环境必须配置 HTTPS
 * - 不要硬编码密钥
 * - 定期更新依赖
 * - 记录安全日志
 * 
 * 📝 练习任务：
 * - 配置所有安全头
 * - 进行安全检查
 * - 阅读 OWASP 文档
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

const app = new Elysia()
  // 全局安全头中间件
  .onRequest(({ set }) => {
    // 防止 XSS 攻击
    set.headers['X-XSS-Protection'] = '1; mode=block'
    
    // 防止 MIME 类型嗅探
    set.headers['X-Content-Type-Options'] = 'nosniff'
    
    // 防止点击劫持
    set.headers['X-Frame-Options'] = 'DENY'
    
    // 内容安全策略 (CSP)
    set.headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
    
    // Referrer 策略
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    // Permissions Policy (功能策略)
    set.headers['Permissions-Policy'] = [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()'
    ].join(', ')
  })

  // 首页
  .get('/', () => ({
    message: '欢迎访问安全增强的 API',
    timestamp: new Date().toISOString()
  }))

  // 健康检查
  .get('/health', () => ({ status: 'ok' }))

  // API 端点示例
  .get('/api/data', () => ({
    data: ['Item 1', 'Item 2', 'Item 3'],
    security: 'All security headers applied'
  }))

  // 测试 XSS 防护
  .post('/api/echo', ({ body }) => {
    return {
      message: '收到数据',
      data: body
    }
  }, {
    body: t.Object({
      text: t.String({ maxLength: 100 })
    })
  })

  // 测试 iframe (会被拒绝)
  .get('/html/page', () => {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>测试页面</title></head>
      <body>
        <h1>这个页面不能被嵌入到 iframe 中</h1>
        <p>检查响应头 X-Frame-Options</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  })

  .listen(3000, () => {
    console.log('🔒 服务器运行在 http://localhost:3000')
    console.log('📋 应用的安全头:')
    console.log('   X-XSS-Protection: 1; mode=block')
    console.log('   X-Content-Type-Options: nosniff')
    console.log('   X-Frame-Options: DENY')
    console.log('   Content-Security-Policy: 已配置')
    console.log('   Referrer-Policy: strict-origin-when-cross-origin')
    console.log('   Permissions-Policy: 已配置')
    console.log('')
    console.log('🔍 使用 curl -I http://localhost:3000 查看响应头')
  })

export default app
