/**
 * 示例片段：数字验证
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
 * 运行：bun run examples/02-validation/number-validation.ts
 */

import { Elysia, t } from 'elysia'

const products = [
  { id: 1, name: 'iPhone', price: 6999, stock: 100 },
  { id: 2, name: 'MacBook', price: 12999, stock: 50 },
  { id: 3, name: 'iPad', price: 4999, stock: 200 }
]

const app = new Elysia()
  // 基础数字验证
  .post('/products', ({ body }) => {
    const newProduct = {
      id: products.length + 1,
      ...body
    }
    
    return {
      success: true,
      message: '商品创建成功',
      data: newProduct
    }
  }, {
    body: t.Object({
      name: t.String({
        minLength: 1,
        maxLength: 100
      }),
      price: t.Number({
        minimum: 0,
        description: '价格不能为负数'
      }),
      stock: t.Number({
        minimum: 0,
        maximum: 10000,
        default: 0,
        description: '库存 (0-10000)'
      })
    })
  })

  // 数值范围验证
  .post('/submit-age', ({ body }) => {
    const age = body.age
    
    let ageGroup: string
    if (age < 18) ageGroup = '未成年'
    else if (age < 35) ageGroup = '青年'
    else if (age < 60) ageGroup = '中年'
    else ageGroup = '老年'

    return {
      success: true,
      message: '年龄提交成功',
      data: {
        age,
        ageGroup
      }
    }
  }, {
    body: t.Object({
      age: t.Number({
        minimum: 0,
        maximum: 150,
        description: '年龄 (0-150)'
      })
    })
  })

  // 价格区间查询
  .get('/products/price-range', ({ query }) => {
    const minPrice = query.minPrice || 0
    const maxPrice = query.maxPrice || Infinity
    
    const filtered = products.filter(p => 
      p.price >= minPrice && p.price <= maxPrice
    )

    return {
      success: true,
      data: filtered,
      filters: {
        minPrice,
        maxPrice: maxPrice === Infinity ? '无上限' : maxPrice
      }
    }
  }, {
    query: t.Object({
      minPrice: t.Optional(t.Number({
        minimum: 0,
        default: 0
      })),
      maxPrice: t.Optional(t.Number({
        minimum: 0,
        default: 100000
      }))
    })
  })

  // 折扣计算
  .post('/calculate-discount', ({ body }) => {
    const originalPrice = body.price
    const discount = body.discount

    if (discount < 0 || discount > 1) {
      return {
        success: false,
        message: '折扣必须在 0-1 之间'
      }
    }

    const finalPrice = originalPrice * discount
    const saved = originalPrice - finalPrice

    return {
      success: true,
      data: {
        originalPrice,
        discount: `${(discount * 100).toFixed(1)}%`,
        finalPrice: finalPrice.toFixed(2),
        saved: saved.toFixed(2)
      }
    }
  }, {
    body: t.Object({
      price: t.Number({
        minimum: 0
      }),
      discount: t.Number({
        minimum: 0,
        maximum: 1,
        description: '折扣 (0-1, 0.8 表示 8 折)'
      })
    })
  })

app.listen(3201, () => {
  console.log('🚀 服务器运行在 http://localhost:3201')
  console.log('📝 测试接口:')
  console.log('\n1. 创建商品:')
  console.log('   POST /products')
  console.log('   Body: {"name":"AirPods","price":1999,"stock":500}')
  console.log('\n2. 提交年龄:')
  console.log('   POST /submit-age')
  console.log('   Body: {"age":25}')
  console.log('\n3. 价格区间查询:')
  console.log('   GET /products/price-range?minPrice=5000&maxPrice=15000')
  console.log('\n4. 折扣计算:')
  console.log('   POST /calculate-discount')
  console.log('   Body: {"price":1000,"discount":0.8}')
  console.log('\n💡 尝试发送无效数值测试验证效果')
})
