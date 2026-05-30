/**
 * 路径参数示例
 * 知识点：动态路由参数 :id
 * 运行：npx tsx examples/01-router/path-params.ts
 */

import { Elysia } from 'elysia'

// 模拟数据库
const users = [
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 },
  { id: 3, name: '王五', age: 28 }
]

const app = new Elysia()
  // 获取所有用户
  .get('/users', () => {
    return {
      success: true,
      data: users,
      total: users.length
    }
  })

  // 获取单个用户 - 路径参数
  .get('/users/:id', ({ params }) => {
    const id = parseInt(params.id)
    const user = users.find(u => u.id === id)

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    return {
      success: true,
      data: user
    }
  })

  // 多个路径参数
  .get('/users/:userId/posts/:postId', ({ params }) => {
    return {
      message: '获取用户的文章',
      userId: params.userId,
      postId: params.postId
    }
  })

  // 路径参数验证
  .get('/articles/:id', ({ params, set }) => {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      set.status = 400
      return {
        success: false,
        message: 'ID 必须是数字'
      }
    }

    return {
      success: true,
      articleId: id,
      title: `文章标题 ${id}`
    }
  })

app.listen(3101, () => {
  console.log('🚀 服务器运行在 http://localhost:3101')
  console.log('📝 测试接口:')
  console.log('   GET /users           - 获取所有用户')
  console.log('   GET /users/1         - 获取 ID 为 1 的用户')
  console.log('   GET /users/999       - 测试不存在的用户')
  console.log('   GET /users/1/posts/5 - 多参数路由')
  console.log('   GET /articles/123    - 文章详情')
  console.log('   GET /articles/abc    - 测试参数验证')
})
