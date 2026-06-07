/**
 * 示例片段：数组验证
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
 * - 添加邮箱验证
 * - 添加密码验证
 * - 自定义错误信息
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/02-validation/array-validation.ts
 */

import { Elysia, t } from 'elysia'

const app = new Elysia()
  // 基础数组验证
  .post('/tags', ({ body }) => {
    return {
      success: true,
      message: '标签批量添加成功',
      data: {
        count: body.tags.length,
        tags: body.tags.map((tag, index) => ({
          id: index + 1,
          name: tag,
          slug: tag.toLowerCase().replace(/\s+/g, '-')
        }))
      }
    }
  }, {
    body: t.Object({
      tags: t.Array(t.String({
        minLength: 1,
        maxLength: 50
      }), {
        minItems: 1,
        maxItems: 20,
        description: '标签列表 (1-20 个)'
      })
    })
  })

  // 商品 SKU 管理
  .post('/products/:id/skus', ({ params, body }) => {
    return {
      success: true,
      message: `为商品 ${params.id} 创建 SKU`,
      data: {
        productId: params.id,
        skus: body.skus.map((sku, index) => ({
          skuId: `SKU-${params.id}-${index + 1}`,
          attributes: sku.attributes,
          price: sku.price,
          stock: sku.stock
        }))
      }
    }
  }, {
    params: t.Object({
      id: t.Number()
    }),
    body: t.Object({
      skus: t.Array(t.Object({
        attributes: t.Object({
          color: t.String(),
          size: t.String()
        }),
        price: t.Number({ minimum: 0 }),
        stock: t.Number({ minimum: 0 })
      }), {
        minItems: 1,
        maxItems: 50
      })
    })
  })

  // 批量创建评论
  .post('/comments/batch', ({ body }) => {
    const validComments = body.comments.filter(c => c.content.length >= 5)
    const invalidCount = body.comments.length - validComments.length

    return {
      success: true,
      message: `批量创建评论成功`,
      data: {
        total: body.comments.length,
        validCount: validComments.length,
        invalidCount,
        comments: validComments.map((c, i) => ({
          id: i + 1,
          content: c.content,
          author: c.author,
          createdAt: new Date().toISOString()
        }))
      }
    }
  }, {
    body: t.Object({
      comments: t.Array(t.Object({
        author: t.String({ minLength: 1, maxLength: 50 }),
        content: t.String({ minLength: 5, maxLength: 1000 })
      }), {
        minItems: 1,
        maxItems: 100
      })
    })
  })

  // 购物车更新
  .post('/cart/update', ({ body }) => {
    const totalValue = body.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    const itemCount = body.items.reduce((sum, item) => {
      return sum + item.quantity
    }, 0)

    return {
      success: true,
      message: '购物车更新成功',
      data: {
        itemCount,
        totalValue: totalValue.toFixed(2),
        items: body.items
      }
    }
  }, {
    body: t.Object({
      items: t.Array(t.Object({
        productId: t.Number(),
        quantity: t.Number({ minimum: 1, maximum: 99 }),
        price: t.Number({ minimum: 0 })
      }), {
        minItems: 1,
        maxItems: 50
      })
    })
  })

app.listen(3202, () => {
  console.log('🚀 服务器运行在 http://localhost:3202')
  console.log('📝 测试接口:')
  console.log('\n1. 批量添加标签:')
  console.log('   POST /tags')
  console.log('   Body: {"tags":["Elysia","TypeScript","API"]}')
  console.log('\n2. 创建商品 SKU:')
  console.log('   POST /products/1/skus')
  console.log('   Body: {"skus":[{"attributes":{"color":"Red","size":"M"},"price":99,"stock":100}]}')
  console.log('\n3. 批量评论:')
  console.log('   POST /comments/batch')
  console.log('   Body: {"comments":[{"author":"张三","content":"很好用的框架，推荐给大家！"}]}')
  console.log('\n4. 更新购物车:')
  console.log('   POST /cart/update')
  console.log('   Body: {"items":[{"productId":1,"quantity":2,"price":99},{"productId":2,"quantity":1,"price":199}]}')
  console.log('\n💡 尝试发送空数组或超过最大数量的数组测试验证效果')
})
