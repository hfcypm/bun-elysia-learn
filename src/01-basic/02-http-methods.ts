/**
 * Level 1 - 基础入门: 02 Http Methods
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 实现完整的 RESTful CRUD API
 * 2. ✅ 掌握 GET 获取资源列表
 * 3. ✅ 掌握 POST 创建新资源
 * 4. ✅ 掌握 PUT 更新资源
 * 5. ✅ 掌握 DELETE 删除资源
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3001
 * - 共6个 API 端点，分步测试
 * - Bun v1.0+ 或 Node.js 18+
 * - JSON 响应自动设置 Content-Type
 * - Ctrl+C 停止服务器
 * 
 * 📝 练习任务：
 * - 添加 PATCH 方法部分更新
 * - 实现资源嵌套路由
 * - 添加自定义 404 处理
 * 
 * 🔗 相关文档：
- docs/00-README.md - 学习指南
- docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run src/01-basic/02-http-methods.ts
 * 测试：http://localhost:3001
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
