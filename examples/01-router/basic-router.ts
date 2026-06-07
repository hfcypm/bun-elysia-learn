/**
 * 示例片段: Basic Router
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习路由的具体用法
 * 2. ✅ 理解不同路由类型的区别
 * 3. ✅ 可以组合到项目中
 * 4. ✅ 根据需求调整配置
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3100，被占用请修改
 * - 示例代码可直接复制
 * - 根据项目需求调整
 * - 参考完整案例深入学习
 * 
 * 📝 练习任务：
 * - 运行示例测试效果
 * - 修改参数观察变化
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/01-router/basic-router.ts
 * 测试：http://localhost:3100
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
