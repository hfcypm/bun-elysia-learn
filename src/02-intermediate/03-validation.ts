/**
 * Level 2 - 案例 3: 请求验证
 * 知识点:
 * - 使用 TypeBox 进行请求体验证
 * - 路径参数验证
 * - 查询参数验证
 * - 自定义错误处理
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
