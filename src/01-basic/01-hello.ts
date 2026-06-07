/**
 * Level 1 - 基础入门: Hello
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 创建一个基本的 Elysia 应用
 * 2. ✅ 定义基础路由和处理请求
 * 3. ✅ 启动 HTTP 服务器
 * 4. ✅ 理解请求和响应的数据流
 * 5. ✅ 通过浏览器或工具测试 API
 * 
 * ⚠️ 注意事项：
 * - 确保已安装 Bun v1.0+ 或 Node.js 18+
 * - 端口被占用时修改为其他端口
 * - JSON 响应会自动设置 Content-Type
 * - 使用 Ctrl+C 停止服务器
 * 
 * 📝 练习任务：
 * - 修改响应内容
 * - 添加新的路由
 * - 尝试不同的 HTTP 方法
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
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
