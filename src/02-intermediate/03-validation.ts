/**
 * Level 2 - 进阶技能: Validation
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 掌握 TypeBox 数据验证
 * 2. ✅ 定义对象/字符串/数字验证规则
 * 3. ✅ 理解验证失败的错误处理
 * 4. ✅ 自定义验证错误信息
 * 5. ✅ 防止无效数据进入业务逻辑
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3002，被占用请修改
 * - 运行前需要 bun x prisma generate
 * - 确保数据库连接字符串正确
 * - 首次运行需要执行迁移
 * - 验证失败返回 400 状态码
 * - 中间件按顺序执行
 * - 错误处理要完善
 * 
 * 📝 练习任务：
 * - 添加邮箱格式验证
 * - 添加密码强度验证
 * - 自定义错误信息
 * 
 * 🔗 相关文档：
 * - docs/14-PRISMA_TUTORIAL.md - Prisma 完整教程
 * - docs/11-ELYSIA_PRISMA_INTEGRATION.md - Elysia+Prisma 集成
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run src/02-intermediate/03-validation.ts
 * 测试：http://localhost:3002
 */

import { Elysia, t } from 'elysia'

const app = new Elysia()
  // 全局错误处理
  .onError(({ code, error }) => {
    console.error('Error:', error)

    if (code === 'VALIDATION') {
      return {
        success: false,
        message: '验证失败',
        errors: error.errors.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      }
    }

    return {
      success: false,
      message: '服务器错误'
    }
  })

  // 注册 - 验证请求体
  .post('/register', ({ body }) => {
    return {
      success: true,
      message: '注册成功',
      data: {
        username: body.username,
        email: body.email,
        createdAt: new Date().toISOString()
      }
    }
  }, {
    body: t.Object({
      username: t.String({
        minLength: 3,
        maxLength: 20,
        description: '用户名 (3-20 个字符)'
      }),
      email: t.String({
        format: 'email',
        description: '邮箱地址'
      }),
      password: t.String({
        minLength: 6,
        description: '密码 (至少 6 个字符)'
      }),
      age: t.Optional(t.Number({
        minimum: 0,
        maximum: 150,
        description: '年龄 (可选)'
      }))
    })
  })

  // 产品搜索 - 验证查询参数
  .get('/products', ({ query }) => {
    return {
      success: true,
      message: '搜索成功',
      query: query,
      tip: '尝试访问：/products?keyword=手机&page=1&limit=10&sort=price'
    }
  }, {
    query: t.Object({
      keyword: t.String({
        minLength: 1,
        description: '搜索关键词'
      }),
      page: t.Optional(t.Number({
        default: 1,
        minimum: 1,
        description: '页码'
      })),
      limit: t.Optional(t.Number({
        default: 20,
        minimum: 1,
        maximum: 100,
        description: '每页数量'
      })),
      sort: t.Optional(t.Union(
        [t.Literal('price'), t.Literal('sales'), t.Literal('rating')],
        { description: '排序方式' }
      ))
    })
  })

  // 文章详情 - 验证路径参数
  .get('/articles/:id', ({ params }) => {
    return {
      success: true,
      data: {
        id: params.id,
        title: `文章标题 ${params.id}`,
        content: '这是文章内容...',
        author: '作者名'
      }
    }
  }, {
    params: t.Object({
      id: t.Number({
        minimum: 1,
        description: '文章 ID (必须是数字)'
      })
    })
  })

  // 创建商品 - 复杂验证
  .post('/products', ({ body }) => {
    return {
      success: true,
      message: '商品创建成功',
      data: {
        id: Math.floor(Math.random() * 10000),
        ...body,
        createdAt: new Date().toISOString()
      }
    }
  }, {
    body: t.Object({
      name: t.String({
        minLength: 1,
        maxLength: 100,
        description: '商品名称'
      }),
      price: t.Number({
        minimum: 0,
        description: '价格'
      }),
      stock: t.Number({
        minimum: 0,
        default: 0,
        description: '库存数量'
      }),
      category: t.Enum({
        ELECTRONICS: 'electronics',
        CLOTHING: 'clothing',
        FOOD: 'food',
        BOOKS: 'books',
        description: '商品分类'
      }),
      tags: t.Optional(t.Array(t.String())),
      description: t.Optional(t.String())
    })
  })

app.listen(3002, () => {
  console.log('🚀 服务器运行在 http://localhost:3002')
  console.log('📝 验证 API 端点:')
  console.log('   - POST /register     用户注册 (验证 body)')
  console.log('   - GET  /products?keyword=手机&page=1  搜索商品 (验证 query)')
  console.log('   - GET  /articles/1   获取文章 (验证 params)')
  console.log('   - POST /products     创建商品 (复杂验证)')
  console.log('\n💡 验证失败会返回详细的错误信息')
})
