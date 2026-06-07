/**
 * 示例片段: Path Params
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习路由的具体用法
 * 2. ✅ 理解不同路由类型的区别
 * 3. ✅ 可以组合到项目中
 * 4. ✅ 根据需求调整配置
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3101，被占用请修改
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
 * 运行：bun run examples/01-router/path-params.ts
 * 测试：http://localhost:3101
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
