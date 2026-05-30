/**
 * Level 1 - 案例 1: Hello Elysia
 * 知识点:
 * - 创建 Elysia 应用
 * - 基础路由定义
 * - 启动服务器
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
      message: `你好，${params.name}!`,
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
