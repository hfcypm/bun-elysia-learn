/**
 * 示例片段：路由分组
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
 * 运行：bun run examples/01-router/route-groups.ts
 */

import { Elysia } from 'elysia'

const app = new Elysia()
  // 公开路由 - 不需要前缀
  .get('/', () => ({
    message: '首页',
    version: '1.0.0'
  }))

  // 使用路由组组织 API v1
  .group('/api/v1', app => app
    // 用户相关路由
    .group('/users', app => app
      .get('/', () => ({
        message: '获取用户列表',
        apiVersion: 'v1'
      }))
      .get('/me', () => ({
        message: '获取当前用户',
        apiVersion: 'v1'
      }))
      .get('/:id', ({ params }) => ({
        message: `获取用户 ${params.id}`,
        apiVersion: 'v1'
      }))
    )

    // 商品相关路由
    .group('/products', app => app
      .get('/', () => ({
        message: '获取商品列表',
        apiVersion: 'v1'
      }))
      .get('/:id', ({ params }) => ({
        message: `获取商品 ${params.id}`,
        apiVersion: 'v1'
      }))
    )

    // 订单相关路由
    .group('/orders', app => app
      .get('/', () => ({
        message: '获取订单列表',
        apiVersion: 'v1'
      }))
      .post('/', () => ({
        message: '创建订单',
        apiVersion: 'v1'
      }))
    )
  )

  // API v2 路由组
  .group('/api/v2', app => app
    .get('/users', () => ({
      message: '获取用户列表 (v2)',
      apiVersion: 'v2',
      features: ['新特性 1', '新特性 2']
    }))
    .get('/products', () => ({
      message: '获取商品列表 (v2)',
      apiVersion: 'v2',
      features: ['新特性 1', '新特性 2']
    }))
  )

  // 带组中间件的路由
  .group('/admin', app => app
    // 组中间件 - 模拟权限检查
    .onBeforeHandle(({ set }) => {
      const isAdmin = true // 实际项目中应该验证 token
      if (!isAdmin) {
        set.status = 403
        return { error: '需要管理员权限' }
      }
    })
    .get('/dashboard', () => ({
      page: '管理后台首页',
      data: {
        totalUsers: 1000,
        totalOrders: 5000,
        revenue: 1000000
      }
    }))
    .get('/users', () => ({
      page: '用户管理',
      users: ['用户 1', '用户 2', '用户 3']
    }))
  )

app.listen(3103, () => {
  console.log('🚀 服务器运行在 http://localhost:3103')
  console.log('📝 测试接口:')
  console.log('\n公开路由:')
  console.log('   GET /')
  console.log('\nAPI v1:')
  console.log('   GET /api/v1/users')
  console.log('   GET /api/v1/users/me')
  console.log('   GET /api/v1/users/1')
  console.log('   GET /api/v1/products')
  console.log('   GET /api/v1/orders')
  console.log('\nAPI v2:')
  console.log('   GET /api/v2/users')
  console.log('   GET /api/v2/products')
  console.log('\n管理后台 (带中间件):')
  console.log('   GET /admin/dashboard')
  console.log('   GET /admin/users')
})
