/**
 * 练习 2.1 - 邮箱订阅系统
 * 
 * 学习目标:
 * - 实现邮件格式验证
 * - 使用中间件处理跨域
 * - 实现订阅状态管理
 * - 添加时间戳记录
 * 
 * 功能要求:
 * 1. POST /subscribe - 订阅邮箱
 * 2. GET /subscribe/:email - 查询订阅状态
 * 3. DELETE /subscribe/:email - 取消订阅
 * 4. GET /subscribers - 获取所有订阅者 (管理员)
 */

import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'

// 订阅者数据类型
interface Subscriber {
  email: string
  subscribedAt: Date
  status: 'active' | 'unsubscribed' | 'bounced'
  tags: string[]
}

// 内存存储
const subscribers = new Map<string, Subscriber>()

// 邮箱验证正则表达式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const app = new Elysia()
  // 使用 CORS 中间件
  .use(cors())
  .group('/subscribe', app => app
    // POST /subscribe - 订阅邮箱
    .post('', ({ body, set }) => {
      const { email, tags = [] } = body

      // 验证邮箱格式
      if (!email || typeof email !== 'string') {
        set.status = 400
        return {
          success: false,
          error: '邮箱地址不能为空'
        }
      }

      if (!emailRegex.test(email)) {
        set.status = 400
        return {
          success: false,
          error: '邮箱格式不正确'
        }
      }

      // 检查是否已订阅
      const existing = subscribers.get(email)
      if (existing && existing.status === 'active') {
        set.status = 409 // Conflict
        return {
          success: false,
          error: '该邮箱已订阅',
          subscribedAt: existing.subscribedAt
        }
      }

      // 创建或重新激活订阅
      const subscriber: Subscriber = {
        email,
        subscribedAt: new Date(),
        status: 'active',
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean)
      }

      subscribers.set(email, subscriber)

      set.status = 201
      return {
        success: true,
        message: '订阅成功',
        data: subscriber
      }
    })

    // GET /subscribe/:email - 查询订阅状态
    .get('/:email', ({ params, set }) => {
      const { email } = params

      if (!emailRegex.test(email)) {
        set.status = 400
        return {
          success: false,
          error: '邮箱格式不正确'
        }
      }

      const subscriber = subscribers.get(email)
      
      if (!subscriber) {
        set.status = 404
        return {
          success: false,
          error: '该邮箱未订阅'
        }
      }

      return {
        success: true,
        data: subscriber
      }
    })

    // DELETE /subscribe/:email - 取消订阅
    .delete('/:email', ({ params, set }) => {
      const { email } = params

      if (!emailRegex.test(email)) {
        set.status = 400
        return {
          success: false,
          error: '邮箱格式不正确'
        }
      }

      const subscriber = subscribers.get(email)
      
      if (!subscriber) {
        set.status = 404
        return {
          success: false,
          error: '该邮箱未订阅'
        }
      }

      // 更新状态为已取消
      subscriber.status = 'unsubscribed'
      subscriber.unsubscribedAt = new Date()
      subscribers.set(email, subscriber)

      return {
        success: true,
        message: '已取消订阅',
        data: subscriber
      }
    })
  )

  // GET /subscribers - 获取所有订阅者 (管理员功能)
  .get('/subscribers', ({ query }) => {
    const statusFilter = query.status as Subscriber['status'] | undefined
    const tagFilter = query.tag as string | undefined

    let allSubscribers = Array.from(subscribers.values())

    // 按状态过滤
    if (statusFilter) {
      allSubscribers = allSubscribers.filter(s => s.status === statusFilter)
    }

    // 按标签过滤
    if (tagFilter) {
      allSubscribers = allSubscribers.filter(s => s.tags.includes(tagFilter))
    }

    // 按订阅时间倒序
    allSubscribers.sort((a, b) => 
      new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
    )

    return {
      success: true,
      count: allSubscribers.length,
      data: allSubscribers
    }
  })

  // POST /subscribers/reactivate - 重新激活订阅
  .post('/subscribers/reactivate', ({ body, set }) => {
    const { email } = body

    if (!email || !emailRegex.test(email)) {
      set.status = 400
      return {
        success: false,
        error: '邮箱格式不正确'
      }
    }

    const subscriber = subscribers.get(email)
    
    if (!subscriber) {
      set.status = 404
      return {
        success: false,
        error: '该邮箱从未订阅'
      }
    }

    if (subscriber.status === 'active') {
      set.status = 400
      return {
        success: false,
        error: '该邮箱已在订阅状态'
      }
    }

    subscriber.status = 'active'
    subscriber.subscribedAt = new Date()
    subscribers.set(email, subscriber)

    return {
      success: true,
      message: '订阅已重新激活',
      data: subscriber
    }
  })

  .listen(3003)

console.log('📧 邮箱订阅 API 运行在 http://localhost:3003')
console.log('📖 测试端点:')
console.log('   POST   /subscribe - 订阅邮箱')
console.log('   GET    /subscribe/:email - 查询订阅状态')
console.log('   DELETE /subscribe/:email - 取消订阅')
console.log('   GET    /subscribers - 获取所有订阅者')
console.log('   POST   /subscribers/reactivate - 重新激活订阅')

export type SubscriptionApp = typeof app
