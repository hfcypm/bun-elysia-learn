/**
 * 示例片段: Json Response
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

import { Elysia } from 'elysia'

// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

// 成功响应工厂函数
function successResponse<T>(data: T, message: string = '操作成功'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      version: 'v1.0.0'
    }
  }
}

// 错误响应工厂函数
function errorResponse(code: string, message: string, status: number = 400): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      version: 'v1.0.0'
    }
  }
}

const app = new Elysia()
  // 全局错误处理
  .onError(({ code, error }) => {
    console.error('Error:', error)
    
    if (code === 'NOT_FOUND') {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '接口不存在'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'global',
          version: 'v1.0.0'
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器错误'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'global',
        version: 'v1.0.0'
      }
    }
  })

  // 标准成功响应
  .get('/success', () => {
    return successResponse({
      items: ['Item 1', 'Item 2', 'Item 3'],
      count: 3
    }, '获取成功')
  })

  // 带分页的响应
  .get('/users', ({ query }) => {
    const page = query.page || 1
    const limit = query.limit || 10
    
    return successResponse({
      users: [
        { id: 1, name: '张三', email: 'zhang@example.com' },
        { id: 2, name: '李四', email: 'li@example.com' }
      ],
      pagination: {
        page,
        limit,
        total: 50,
        totalPages: 5
      }
    })
  })

  // 创建资源 (201)
  .post('/users', ({ body }) => {
    const newUser = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    return {
      success: true,
      message: '创建成功',
      data: newUser,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        version: 'v1.0.0'
      }
    }
  })

  // 删除资源 (204)
  .delete('/users/:id', ({ params, set }) => {
    set.status = 204
    return successResponse(null, '删除成功')
  })

  // 业务错误
  .get('/error/business', () => {
    return {
      success: false,
      message: '业务验证失败',
      error: {
        code: 'BUSINESS_ERROR',
        message: '库存不足',
        details: {
          required: 10,
          available: 3
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        version: 'v1.0.0'
      }
    }
  })

  // 标准错误响应
  .get('/error/not-found', ({ set }) => {
    set.status = 404
    return errorResponse('RESOURCE_NOT_FOUND', '资源不存在', 404)
  })

  // 系统错误
  .get('/error/system', () => {
    throw new Error('模拟系统错误')
  })

  // 查看响应格式说明
  .get('/response-format', () => {
    return {
      message: '响应格式说明',
      format: {
        success: {
          structure: {
            success: 'boolean - 是否成功',
            message: 'string - 成功消息',
            data: 'any - 返回数据',
            meta: 'object - 元数据'
          },
          example: successResponse({ test: 'data' }, '示例消息')
        },
        error: {
          structure: {
            success: 'boolean - 固定为 false',
            error: {
              code: 'string - 错误代码',
              message: 'string - 错误消息',
              details: 'any - 详细错误 (可选)'
            },
            meta: 'object - 元数据'
          }
        }
      },
      statusCodes: {
        200: '成功',
        201: '创建成功',
        204: '删除成功 (无内容)',
        400: '请求参数错误',
        404: '资源不存在',
        429: '请求过于频繁',
        500: '服务器错误'
      }
    }
  })

app.listen(3400, () => {
  console.log('🚀 服务器运行在 http://localhost:3400')
  console.log('\n📝 响应格式:')
  console.log('   成功：{ success: true, message, data, meta }')
  console.log('   失败：{ success: false, error: { code, message }, meta }')
  console.log('\n📝 测试接口:')
  console.log('   GET /response-format   - 查看响应格式说明')
  console.log('   GET /success           - 标准成功响应')
  console.log('   GET /users             - 分页数据响应')
  console.log('   POST /users            - 创建资源 (201)')
  console.log('   DELETE /users/1        - 删除资源 (204)')
  console.log('   GET /error/business    - 业务错误')
  console.log('   GET /error/not-found   - 404 错误')
  console.log('   GET /error/system      - 系统错误')
})
