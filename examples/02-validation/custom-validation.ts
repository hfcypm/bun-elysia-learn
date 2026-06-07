/**
 * 示例片段: Custom Validation
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现细节
 * 3. ✅ 可以组合到项目中
 * 
 * ⚠️ 注意事项：
 * - 示例代码可以复制使用
 * - 根据需求调整配置
 * - 参考完整案例学习
 * 
 * 📝 练习任务：
 * - 运行示例
 * - 修改参数测试
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

// 自定义验证器：检查是否为中国的身份证号
function isChineseIdCard(value: string): boolean {
  const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  return pattern.test(value)
}

// 自定义验证器：检查密码强度
function isStrongPassword(value: string): boolean {
  // 至少包含大小写字母、数字、特殊字符，长度 8-20
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
  return pattern.test(value)
}

// 自定义验证器：检查域名
function isValidDomain(value: string): boolean {
  const pattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return pattern.test(value)
}

const app = new Elysia()
  // 身份证验证
  .post('/verify-idcard', ({ body }) => {
    return {
      success: true,
      message: '身份证格式验证通过',
      data: {
        idCard: body.idCard,
        // 简单提取生日信息
        birthday: body.idCard.slice(6, 14)
      }
    }
  }, {
    body: t.Object({
      idCard: t.String({
        validate: (value) => {
          if (!isChineseIdCard(value)) {
            return '请输入有效的中国身份证号'
          }
          return true
        },
        description: '中国身份证号 (18 位)'
      })
    })
  })

  // 密码强度验证
  .post('/change-password', ({ body }) => {
    return {
      success: true,
      message: '密码修改成功',
      data: {
        // 实际项目中不要返回密码
        message: '密码已更新'
      }
    }
  }, {
    body: t.Object({
      oldPassword: t.String(),
      newPassword: t.String({
        validate: (value) => {
          if (!isStrongPassword(value)) {
            return '密码必须包含大小写字母、数字和特殊字符，长度 8-20'
          }
          return true
        },
        description: '强密码规则'
      })
    })
  })

  // 网站域名验证
  .post('/add-website', ({ body }) => {
    return {
      success: true,
      message: '网站添加成功',
      data: {
        domain: body.domain,
        url: `https://${body.domain}`,
        createdAt: new Date().toISOString()
      }
    }
  }, {
    body: t.Object({
      domain: t.String({
        name: '域名',
        validate: (value) => {
          if (!isValidDomain(value)) {
            return '请输入有效的域名格式 (如：example.com)'
          }
          return true
        }
      })
    })
  })

  // 自定义验证：价格不能为 0 或负数
  .post('/create-coupon', ({ body }) => {
    const discount = body.discount
    const type = body.type

    // 根据优惠券类型进行不同验证
    if (type === 'percent' && (discount < 0 || discount > 100)) {
      return {
        success: false,
        message: '折扣券必须在 0-100 之间'
      }
    }

    if (type === 'fixed' && discount <= 0) {
      return {
        success: false,
        message: '现金券金额必须大于 0'
      }
    }

    return {
      success: true,
      message: '优惠券创建成功',
      data: {
        ...body,
        code: `COUPON${Date.now()}`
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 50 }),
      type: t.Union([t.Literal('percent'), t.Literal('fixed')]),
      discount: t.Number({ minimum: 0 }),
      minAmount: t.Optional(t.Number({ minimum: 0 })),
      maxAmount: t.Optional(t.Number({ minimum: 0 }))
    })
  })

app.listen(3204, () => {
  console.log('🚀 服务器运行在 http://localhost:3204')
  console.log('📝 测试接口:')
  console.log('\n1. 身份证验证:')
  console.log('   POST /verify-idcard')
  console.log('   Body: {"idCard":"110101199001011234"}')
  console.log('\n2. 修改密码:')
  console.log('   POST /change-password')
  console.log('   Body: {"oldPassword":"old123","newPassword":"New@1234"}')
  console.log('\n3. 添加网站:')
  console.log('   POST /add-website')
  console.log('   Body: {"domain":"example.com"}')
  console.log('\n4. 创建优惠券:')
  console.log('   POST /create-coupon')
  console.log('   Body: {"name":"八折券","type":"percent","discount":80}')
  console.log('\n💡 尝试发送不符合规则的数据测试自定义验证')
})
