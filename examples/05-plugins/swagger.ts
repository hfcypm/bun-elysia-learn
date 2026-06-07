/**
 * 示例片段：Swagger 插件
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
 * - 配置插件选项
 * - 添加插件功能
 * - 参考官方文档
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/05-plugins/swagger.ts
 */

import { Elysia, t } from 'elysia'

// 由于需要安装 @elysiajs/swagger 插件
// 此示例展示如何集成和配置
// 实际使用需要先运行：npm install @elysiajs/swagger

const app = new Elysia()
  // 使用 Swagger 插件 (需要安装)
  // .use(swagger({
  //   path: '/swagger',
  //   documentation: {
  //     info: {
  //       title: 'Elysia Learning API',
  //       version: '1.0.0',
  //       description: '学习案例 API 文档'
  //     },
  //     tags: [
  //       { name: '用户', description: '用户管理' },
  //       { name: '文章', description: '文章内容' }
  //     ]
  //   }
  // }))

  // 基础路由 (无 Swagger)
  .get('/', () => ({
    message: 'Elysia Swagger 示例',
    note: '此示例需要安装 @elysiajs/swagger 插件',
    install: 'npm install @elysiajs/swagger'
  }))

  // 用户管理接口
  .get('/users', () => {
    return {
      success: true,
      data: [
        { id: 1, name: '张三', email: 'zhang@example.com' },
        { id: 2, name: '李四', email: 'li@example.com' }
      ]
    }
  }, {
    // 类型定义会反映到 OpenAPI 文档
    response: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String()
      }))
    })
  })

  // 创建用户
  .post('/users', ({ body }) => {
    return {
      success: true,
      data: {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 50 }),
      email: t.String({ format: 'email' }),
      role: t.Optional(t.Union([
        t.Literal('user'),
        t.Literal('admin')
      ]))
    })
  })

  // 获取单用户
  .get('/users/:id', ({ params }) => {
    return {
      success: true,
      data: {
        id: parseInt(params.id),
        name: '示例用户',
        email: 'user@example.com'
      }
    }
  }, {
    params: t.Object({
      id: t.Number()
    })
  })

  // 文章接口
  .get('/articles', ({ query }) => {
    return {
      success: true,
      data: {
        articles: [
          { id: 1, title: 'Elysia 入门', views: 1234 },
          { id: 2, title: 'TypeScript 实战', views: 5678 }
        ],
        page: query.page || 1,
        total: 50
      }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ default: 1 })),
      limit: t.Optional(t.Number({ default: 10 }))
    })
  })

  // API 文档说明
  .get('/api-docs', () => {
    return {
      message: 'API 文档说明',
      swagger: {
        description: 'Swagger/OpenAPI 自动生成 API 文档',
        benefits: [
          '交互式界面',
          '实时测试 API',
          '自动生成文档',
          '支持认证'
        ],
        install: 'npm install @elysiajs/swagger',
        usage: `
import { swagger } from '@elysiajs/swagger'

app.use(swagger({
  path: '/swagger',
  documentation: {
    info: { title: 'API', version: '1.0.0' }
  }
}))
        `.trim()
      },
      endpoints: {
        'GET /': '欢迎信息',
        'GET /users': '获取用户列表',
        'POST /users': '创建用户',
        'GET /users/:id': '获取单个用户',
        'GET /articles': '获取文章列表',
        'GET /api-docs': '本文档说明'
      }
    }
  })

app.listen(3500, () => {
  console.log('🚀 服务器运行在 http://localhost:3500')
  console.log('\n📝 Swagger 配置:')
  console.log('   需要先安装：npm install @elysiajs/swagger')
  console.log('\n📝 使用示例:')
  console.log(`
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'My API',
        version: '1.0.0'
      }
    }
  }))
  // ... 定义你的路由
  .listen(3000)
   `)
  console.log('\n📝 测试接口:')
  console.log('   GET /          - 首页')
  console.log('   GET /api-docs  - API 文档说明')
  console.log('   GET /users     - 用户列表 (有类型定义)')
  console.log('   POST /users    - 创建用户 (有验证)')
})
