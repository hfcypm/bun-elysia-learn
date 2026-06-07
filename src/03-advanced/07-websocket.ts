/**
 * Level 3 - 实战项目: Websocket
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 开发完整的业务系统
 * 2. ✅ 实现用户认证和授权
 * 3. ✅ 处理复杂的数据关系
 * 4. ✅ 实现 WebSocket 实时通信
 * 5. ✅ 掌握 API 最佳实践
 * 
 * ⚠️ 注意事项：
 * - 注意代码组织和模块拆分
 * - 错误处理要完善
 * - 密码必须加密存储
 * - JWT 设置合理的过期时间
 * - 注意性能优化
 * 
 * 📝 练习任务：
 * - 扩展系统功能
 * - 添加单元测试
 * - 优化查询性能
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

// 模拟用户存储
interface ChatUser {
  id: string
  username: string
  connectedAt: string
}

// 消息存储
interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  type: 'message' | 'join' | 'leave' | 'system'
  timestamp: string
}

// 全局状态
const users = new Map<string, ChatUser>()
const messages: ChatMessage[] = []
let messageIdCounter = 0

// 广播函数
function broadcast(payload: any, senderWs?: any) {
  // 注意：实际项目中需要使用 Elysia 的 WebSocket API
  // 这里仅作为示例，展示消息格式
  console.log('Broadcast:', JSON.stringify(payload))
}

const app = new Elysia()
  // ========== HTTP 接口 ==========
  
  // 获取聊天室信息
  .get('/chat/info', () => {
    return {
      success: true,
      data: {
        onlineUsers: users.size,
        messageCount: messages.length,
        recentMessages: messages.slice(-20)
      }
    }
  })

  // 获取在线用户列表
  .get('/chat/users', () => {
    return {
      success: true,
      data: Array.from(users.values()),
      total: users.size
    }
  })

  // 获取聊天记录
  .get('/chat/history', ({ query }) => {
    const limit = query.limit || 50
    const offset = query.offset || 0
    
    return {
      success: true,
      data: {
        messages: messages.slice(offset, offset + limit),
        total: messages.length,
        hasMore: offset + limit < messages.length
      }
    }
  }, {
    query: t.Object({
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
      offset: t.Optional(t.Number({ minimum: 0, default: 0 }))
    })
  })

  // 发送 HTTP 消息 (用于测试)
  .post('/chat/message', ({ body, set }) => {
    const user = users.get(body.userId)
    
    if (!user) {
      set.status = 400
      return {
        success: false,
        message: '用户不存在或未连接'
      }
    }

    const message: ChatMessage = {
      id: `msg_${++messageIdCounter}`,
      userId: body.userId,
      username: user.username,
      content: body.content,
      type: 'message',
      timestamp: new Date().toISOString()
    }

    messages.push(message)
    
    // 广播消息
    broadcast({
      type: 'message',
      data: message
    })

    return {
      success: true,
      message: '发送成功',
      data: message
    }
  }, {
    body: t.Object({
      userId: t.String(),
      content: t.String({ minLength: 1, maxLength: 500 })
    })
  })

  // ========== WebSocket 事件演示 ==========
  // 注意：完整的 WebSocket 实现需要使用 Elysia 的 ws 插件
  // 这里展示事件处理逻辑
  
  .get('/ws', () => {
    return {
      success: true,
      message: 'WebSocket 端点',
      note: '请使用 WebSocket 客户端连接 ws://localhost:3006/ws',
      events: {
        client: ['connect', 'message', 'heartbeat', 'disconnect'],
        server: ['welcome', 'message', 'user_joined', 'user_left', 'error']
      }
    }
  })

  // ========== 系统消息 ==========
  .post('/chat/system', ({ body, set }) => {
    // 仅管理员可用
    if (body.adminKey !== 'admin123') {
      set.status = 403
      return {
        success: false,
        message: '权限不足'
      }
    }

    const systemMessage: ChatMessage = {
      id: `sys_${++messageIdCounter}`,
      userId: 'system',
      username: 'System',
      content: body.content,
      type: 'system',
      timestamp: new Date().toISOString()
    }

    messages.push(systemMessage)

    broadcast({
      type: 'system',
      data: systemMessage
    })

    return {
      success: true,
      message: '系统消息已发送'
    }
  }, {
    body: t.Object({
      adminKey: t.String(),
      content: t.String()
    })
  })

  // ========== 聊天室管理 ==========
  .delete('/chat/user/:userId', ({ params, set }) => {
    // 移除用户
    const removed = users.delete(params.userId)
    
    if (!removed) {
      set.status = 404
      return {
        success: false,
        message: '用户不存在'
      }
    }

    // 广播用户离开
    const leaveMessage: ChatMessage = {
      id: `msg_${++messageIdCounter}`,
      userId: params.userId,
      username: params.userId,
      content: '',
      type: 'leave',
      timestamp: new Date().toISOString()
    }

    broadcast({
      type: 'user_left',
      data: leaveMessage
    })

    return {
      success: true,
      message: '用户已移除'
    }
  })

  // 清空聊天历史
  .delete('/chat/history', ({ set }) => {
    messages.length = 0
    messageIdCounter = 0

    broadcast({
      type: 'system',
      data: {
        id: 'sys_clear',
        content: '聊天历史已清空',
        timestamp: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: '聊天历史已清空'
    }
  })

  // ========== 健康检查 ==========
  .get('/health', () => {
    return {
      status: 'ok',
      onlineUsers: users.size,
      totalMessages: messages.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  })

app.listen(3006, () => {
  console.log('🚀 聊天室 API 运行在 http://localhost:3006')
  console.log('\n📝 HTTP API 端点:')
  console.log('   GET    /chat/info          获取聊天室信息')
  console.log('   GET    /chat/users         获取在线用户')
  console.log('   GET    /chat/history       获取聊天记录')
  console.log('   POST   /chat/message       发送消息')
  console.log('   POST   /chat/system        发送系统消息')
  console.log('   DELETE /chat/user/:id      移除用户')
  console.log('   DELETE /chat/history       清空历史')
  console.log('\n🔌 WebSocket:')
  console.log('   WS     ws://localhost:3006/ws')
  console.log('\n💡 WebSocket 客户端示例代码:')
  console.log(`
const ws = new WebSocket('ws://localhost:3006/ws')

ws.onopen = () => {
  console.log('已连接')
  // 发送 join 消息
  ws.send(JSON.stringify({
    type: 'join',
    data: { username: '用户 A' }
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('收到消息:', data)
}

ws.onerror = (error) => {
  console.error('连接错误:', error)
}

ws.onclose = () => {
  console.log('连接已关闭')
}
  `)
})
