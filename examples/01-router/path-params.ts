/**
 * 示例片段：路径参数
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现
 * 3. ✅ 可以组合使用
 * 
 * ⚠️ 注意事项：
 * - 示例代码可复制
 * - 按需调整配置
 * - 参考完整案例
 * 
 * 📝 练习任务：
 * - 修改路由路径
 * - 添加新的路由
 * - 组合路由分组
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/01-router/path-params.ts
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
