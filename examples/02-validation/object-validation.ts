/**
 * 示例片段：对象验证
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
 * 运行：bun run examples/02-validation/object-validation.ts
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
