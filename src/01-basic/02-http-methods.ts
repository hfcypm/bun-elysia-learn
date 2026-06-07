/**
 * Level 1 - 基础入门: Http Methods
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

// 模拟数据库
let todos = [
  { id: 1, title: '学习 Elysia', completed: false },
  { id: 2, title: '创建 API', completed: true }
]

const app = new Elysia()
  // GET - 获取所有待办事项
  .get('/todos', () => {
    return {
      success: true,
      data: todos,
      count: todos.length
    }
  })

  // GET - 获取单个待办事项
  .get('/todos/:id', ({ params, set }) => {
    const id = parseInt(params.id)
    const todo = todos.find(t => t.id === id)

    if (!todo) {
      set.status = 404
      return {
        success: false,
        message: '待办事项不存在'
      }
    }

    return {
      success: true,
      data: todo
    }
  })

  // POST - 创建待办事项
  .post('/todos', ({ body, set }) => {
    const newTodo = {
      id: Math.max(...todos.map(t => t.id)) + 1,
      title: body.title,
      completed: false
    }

    todos.push(newTodo)
    set.status = 201

    return {
      success: true,
      message: '创建成功',
      data: newTodo
    }
  })

  // PUT - 更新待办事项
  .put('/todos/:id', ({ params, body, set }) => {
    const id = parseInt(params.id)
    const todoIndex = todos.findIndex(t => t.id === id)

    if (todoIndex === -1) {
      set.status = 404
      return {
        success: false,
        message: '待办事项不存在'
      }
    }

    todos[todoIndex] = { ...todos[todoIndex], ...body }

    return {
      success: true,
      message: '更新成功',
      data: todos[todoIndex]
    }
  })

  // PATCH - 部分更新
  .patch('/todos/:id/complete', ({ params, set }) => {
    const id = parseInt(params.id)
    const todo = todos.find(t => t.id === id)

    if (!todo) {
      set.status = 404
      return {
        success: false,
        message: '待办事项不存在'
      }
    }

    todo.completed = !todo.completed

    return {
      success: true,
      message: `已标记为${todo.completed ? '完成' : '未完成'}`,
      data: todo
    }
  })

  // DELETE - 删除待办事项
  .delete('/todos/:id', ({ params, set }) => {
    const id = parseInt(params.id)
    const todoIndex = todos.findIndex(t => t.id === id)

    if (todoIndex === -1) {
      set.status = 404
      return {
        success: false,
        message: '待办事项不存在'
      }
    }

    todos.splice(todoIndex, 1)

    return {
      success: true,
      message: '删除成功'
    }
  })

app.listen(3001, () => {
  console.log('🚀 服务器运行在 http://localhost:3001')
  console.log('📝 TODO API 端点:')
  console.log('   - GET    /todos          获取所有')
  console.log('   - GET    /todos/:id      获取单个')
  console.log('   - POST   /todos          创建')
  console.log('   - PUT    /todos/:id      全量更新')
  console.log('   - PATCH  /todos/:id/complete  切换完成状态')
  console.log('   - DELETE /todos/:id      删除')
})
