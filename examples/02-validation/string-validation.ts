/**
 * 字符串验证示例
 * 知识点：TypeBox 字符串验证规则
 * 运行：npx tsx examples/02-validation/string-validation.ts
 */

import { Elysia, t } from 'elysia'

const app = new Elysia()
  // 基础字符串验证
  .post('/register', ({ body }) => {
    return {
      success: true,
      message: '注册成功',
      data: body
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
        maxLength: 100,
        description: '密码 (至少 6 个字符)'
      })
    })
  })

  // 带模式匹配的字符串验证
  .post('/validate-phone', ({ body }) => {
    return {
      success: true,
      message: '手机号格式正确',
      data: body
    }
  }, {
    body: t.Object({
      phone: t.String({
        pattern: '^1[3-9]\\d{9}$',
        description: '中国手机号 (11 位数字)'
      })
    })
  })

  // 多个字段验证
  .post('/update-profile', ({ body }) => {
    return {
      success: true,
      message: '资料更新成功',
      data: body
    }
  }, {
    body: t.Object({
      nickname: t.String({
        minLength: 1,
        maxLength: 50,
        description: '昵称'
      }),
      bio: t.String({
        minLength: 0,
        maxLength: 500,
        description: '个人简介 (最多 500 字)'
      }),
      website: t.String({
        format: 'uri',
        description: '个人网站 (可选)'
      })
    })
  })

app.listen(3200, () => {
  console.log('🚀 服务器运行在 http://localhost:3200')
  console.log('📝 测试接口:')
  console.log('\n1. 用户注册:')
  console.log('   POST /register')
  console.log('   Body: {"username":"zhangsan","email":"zhang@example.com","password":"123456"}')
  console.log('\n2. 手机号验证:')
  console.log('   POST /validate-phone')
  console.log('   Body: {"phone":"13800138000"}')
  console.log('\n3. 更新资料:')
  console.log('   POST /update-profile')
  console.log('   Body: {"nickname":"张三","bio":"开发者","website":"https://example.com"}')
  console.log('\n💡 尝试发送无效数据测试验证效果')
})
