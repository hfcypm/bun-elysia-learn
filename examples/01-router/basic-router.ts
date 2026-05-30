/**
 * 基础路由示例
 * 知识点：GET/POST 路由定义
 * 运行：npx tsx examples/01-router/basic-router.ts
 */

import { Elysia } from 'elysia'

const app = new Elysia()
  // 基础 GET 路由
  .get('/', () => {
    return {
      message: '欢迎学习 Elysia 路由!',
      tip: '这是根路径 /'
    }
  })

  // 带问候的 GET 路由
  .get('/hello', () => {
    return {
      message: '你好，世界!',
      time: new Date().toLocaleTimeString()
    }
  })

  // POST 路由
  .post('/echo', ({ body }) => {
    return {
      message: '收到你的消息',
      echo: body.message
    }
  })

app.listen(3100, () => {
  console.log('🚀 服务器运行在 http://localhost:3100')
  console.log('📝 测试接口:')
  console.log('   GET  /          - 欢迎消息')
  console.log('   GET  /hello     - 问候消息')
  console.log('   POST /echo      - 消息回显')
  console.log('\n💡 使用 curl 测试 POST:')
  console.log('   curl -X POST http://localhost:3100/echo -H "Content-Type: application/json" -d \'{"message":"Hello"}\'')
})
