/**
 * 示例片段: Object Validation
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习验证的具体用法
 * 2. ✅ 理解不同类型验证规则
 * 3. ✅ 复制使用示例代码
 * 4. ✅ 添加更多验证条件
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3203，被占用请修改
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
 * 运行：bun run examples/02-validation/object-validation.ts
 * 测试：http://localhost:3203
 */

import { Elysia, t } from 'elysia'

const app = new Elysia()
  // 嵌套对象验证 - 用户资料
  .post('/user/profile', ({ body }) => {
    return {
      success: true,
      message: '资料更新成功',
      data: body
    }
  }, {
    body: t.Object({
      user: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        email: t.String({ format: 'email' }),
        age: t.Optional(t.Number({ minimum: 0, maximum: 150 }))
      }),
      contact: t.Object({
        phone: t.String({ pattern: '^1[3-9]\\d{9}$' }),
        address: t.Object({
          province: t.String(),
          city: t.String(),
          district: t.String(),
          detail: t.String({ minLength: 5 })
        })
      })
    })
  })

  // 联合类型验证
  .post('/payment', ({ body }) => {
    return {
      success: true,
      message: '支付请求已接收',
      data: {
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        details: body.paymentMethod === 'credit_card' 
          ? { cardLast4: body.cardNumber.slice(-4) }
          : body.paymentMethod === 'alipay'
          ? { alipayAccount: body.alipayAccount }
          : { bankName: body.bankName }
      }
    }
  }, {
    body: t.Object({
      amount: t.Number({ minimum: 0.01 }),
      paymentMethod: t.Union([
        t.Literal('credit_card'),
        t.Literal('alipay'),
        t.Literal('bank_transfer')
      ])
    })
  })

  // 条件字段验证
  .post('/product/create', ({ body }) => {
    return {
      success: true,
      message: '商品创建成功',
      data: body
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      type: t.Union([
        t.Literal('physical'),
        t.Literal('digital'),
        t.Literal('service')
      ]),
      price: t.Number({ minimum: 0 }),
      // 实物商品需要库存
      stock: t.Optional(t.Number({ minimum: 0 })),
      // 数字商品需要下载链接
      downloadUrl: t.Optional(t.String({ format: 'uri' })),
      // 服务商品需要预约时间
     预约时间:// Optional(t.String())
    })
  })

app.listen(3203, () => {
  console.log('🚀 服务器运行在 http://localhost:3203')
  console.log('📝 测试接口:')
  console.log('\n1. 复杂用户资料:')
  console.log('   POST /user/profile')
  console.log('   Body: 完整嵌套对象')
  console.log('\n2. 支付请求:')
  console.log('   POST /payment')
  console.log('   Body: {"amount":100,"paymentMethod":"alipay","alipayAccount":"xxx@example.com"}')
  console.log('\n💡 这些案例展示了复杂对象验证的用法')
})
