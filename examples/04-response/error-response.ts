/**
 * 示例片段: Error Response
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

// 错误码定义
const ErrorCodes = {
  // 客户端错误 4xx
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  
  // 业务错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // 服务端错误 5xx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

// 错误响应工厂
interface ErrorConfig {
  code: string
  message: string
  description: string
  status: number
}

const errorConfigs: Record<string, ErrorConfig> = {
  [ErrorCodes.BAD_REQUEST]: {
    code: 'BAD_REQUEST',
    message: '请求参数错误',
    description: '请检查请求参数格式',
    status: 400
  },
  [ErrorCodes.UNAUTHORIZED]: {
    code: 'UNAUTHORIZED',
    message: '未授权访问',
    description: '请先登录或提供有效 Token',
    status: 401
  },
  [ErrorCodes.FORBIDDEN]: {
    code: 'FORBIDDEN',
    message: '权限不足',
    description: '您没有执行此操作的权限',
    status: 403
  },
  [ErrorCodes.NOT_FOUND]: {
    code: 'NOT_FOUND',
    message: '资源不存在',
    description: '请求的资源不存在',
    status: 404
  }
}

const app = new Elysia()
  // 全局错误处理
  .onError(({ code, error }) => {
    console.error('Global Error:', code, error.message)
    
    return {
      success: false,
      error: {
        code: code === 'VALIDATION' ? ErrorCodes.VALIDATION_ERROR : ErrorCodes.INTERNAL_ERROR,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: error.cause?.constructor?.name || 'Error'
      }
    }
  })

  // 业务错误示例
  .get('/error/validation', ({ set }) => {
    set.status = 400
    return {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: '验证失败',
        details: [
          { field: 'email', message: '邮箱格式不正确' },
          { field: 'password', message: '密码长度至少 6 位' }
        ]
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  })

  // 资源不存在
  .get('/error/not-found/:id', ({ params, set }) => {
    set.status = 404
    return {
      success: false,
      error: {
        code: ErrorCodes.RESOURCE_NOT_FOUND,
        message: '资源不存在',
        details: {
          resourceType: 'user',
          resourceId: params.id,
          suggestion: '请检查 ID 是否正确'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  })

  // 权限错误
  .get('/error/forbidden', ({ set }) => {
    set.status = 403
    return {
      success: false,
      error: {
        code: ErrorCodes.FORBIDDEN,
        message: '权限不足',
        details: {
          requiredRole: 'admin',
          currentRole: 'user',
          hint: '请联系管理员获取权限'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  })

  // 业务冲突
  .get('/error/conflict', ({ set }) => {
    set.status = 409
    return {
      success: false,
      error: {
        code: ErrorCodes.CONFLICT,
        message: '资源冲突',
        details: {
          reason: '用户名已被注册',
          existingValue: 'zhangsan',
          suggestion: '请尝试其他用户名'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  })

  // 服务器错误
  .get('/error/internal', ({ set }) => {
    throw new Error('模拟服务器内部错误')
  })

  // 自定义错误类型
  class BusinessError extends Error {
    code: string
    details: any
    
    constructor(code: string, message: string, details?: any) {
      super(message)
      this.name = 'BusinessError'
      this.code = code
      this.details = details
    }
  }

  // 抛出业务错误
  .get('/error/business-specific', () => {
    throw new BusinessError(
      ErrorCodes.BUSINESS_ERROR,
      '库存不足',
      {
        productId: 'PROD-001',
        required: 10,
        available: 3
      }
    )
  })

  // 错误响应格式说明
  .get('/error-format', () => {
    return {
      message: '错误响应格式说明',
      format: {
        success: 'boolean - 固定为 false',
        error: {
          code: 'string - 错误代码（大写，下划线分隔）',
          message: 'string - 错误消息',
          details: 'any - 详细错误信息（可选）',
          stack: 'string - 调用栈（仅开发环境）'
        },
        meta: {
          timestamp: 'string - 错误发生时间',
          path: 'string - 请求路径'
        }
      },
      errorCodes: {
        '4xx 客户端错误': Object.keys(ErrorCodes).filter(k => !k.includes('_ERROR')),
        '业务错误': ['VALIDATION_ERROR', 'BUSINESS_ERROR', 'RESOURCE_NOT_FOUND'],
        '5xx 服务端错误': ['INTERNAL_ERROR', 'SERVICE_UNAVAILABLE']
      },
      examples: {
        validationError: '/error/validation',
        notFound: '/error/not-found/123',
        forbidden: '/error/forbidden',
        conflict: '/error/conflict',
        businessError: '/error/business-specific'
      }
    }
  })

app.listen(3402, () => {
  console.log('🚀 服务器运行在 http://localhost:3402')
  console.log('\n📝 错误处理示例:')
  console.log('   GET /error-format        - 查看错误格式说明')
  console.log('   GET /error/validation    - 验证错误')
  console.log('   GET /error/not-found/123 - 资源不存在')
  console.log('   GET /error/forbidden     - 权限不足')
  console.log('   GET /error/conflict      - 资源冲突')
  console.log('   GET /error/internal      - 服务器错误')
  console.log('   GET /error/business-specific - 业务错误')
  console.log('\n💡 所有错误都返回统一的格式')
})
