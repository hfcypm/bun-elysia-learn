/**
 * Level 1 - 基础入门: Hello
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 创建第一个 Elysia 应用
 * 2. ✅ 定义基础 GET 路由
 * 3. ✅ 理解路径参数 (/hello/:name) 的用法
 * 4. ✅ 理解查询参数 (/query?name=xxx) 的用法
 * 5. ✅ 启动服务器并通过浏览器测试
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3000，被占用请修改
 * - Bun v1.0+ 或 Node.js 18+
 * - JSON 响应自动设置 Content-Type
 * - Ctrl+C 停止服务器
 * 
 * 📝 练习任务：
 * - 修改欢迎消息内容
 * - 添加 /about 路由返回项目介绍
 * - 尝试添加 POST /submit 路由
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run src/01-basic/01-hello.ts
 * 测试：http://localhost:3000
 */

import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => {
    return {
      message: '🦊 欢迎学习 Elysia!',
      tutorial: 'Level 1 - 基础入门'
    }
  })
  .get('/hello/:name', ({ params }) => {
    return {
      message: \`你好，\${params.name}!\`,
      tip: '这是路径参数的使用示例'
    }
  })
  .get('/query', ({ query }) => {
    return {
      message: '查询参数示例',
      received: query,
      tip: '访问 /query?name=张三&age=25 测试'
    }
  })

app.listen(3000, () => {
  console.log('🚀 服务器运行在 http://localhost:3000')
  console.log('📝 尝试访问:')
  console.log('   - GET /  (首页)')
  console.log('   - GET /hello/Elysia  (路径参数)')
  console.log('   - GET /query?name=张三&age=25  (查询参数)')
})
