/**
 * 单元测试示例 - 测试业务逻辑
 * 
 * 学习目标:
 * - 编写纯函数的单元测试
 * - 测试复杂业务逻辑
 * - 测试边界条件
 * - 使用测试覆盖率和断言
 * 
 * 运行测试:
 * bun test src/testing/03-unit-test-example.test.ts
 */

import { describe, expect, it } from 'bun:test'

// ==================== 被测试的Business 逻辑 ====================

// 用户验证工具
class UserValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[\w-]+@([\w-]+\.)+[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  static validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('密码长度至少 8 位')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含数字')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含特殊字符')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/
    return usernameRegex.test(username)
  }
}

// 价格计算器
class PriceCalculator {
  static calculateDiscount(price: number, discountPercent: number): number {
    if (price < 0) {
      throw new Error('价格不能为负数')
    }
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('折扣必须在 0-100 之间')
    }
    
    const discount = price * (discountPercent / 100)
    return Math.round((price - discount) * 100) / 100
  }

  static calculateTax(price: number, taxRate: number): number {
    if (price < 0) {
      throw new Error('价格不能为负数')
    }
    if (taxRate < 0) {
      throw new Error('税率不能为负数')
    }
    
    const tax = price * taxRate
    return Math.round(tax * 100) / 100
  }

  static calculateShipping(price: number, weight: number, isExpress: boolean): number {
    const baseShipping = 10
    const weightCharge = weight * 2
    
    if (price > 299) {
      return 0
    }
    
    let shipping = baseShipping + weightCharge
    
    if (isExpress) {
      shipping += 20
    }
    
    return shipping
  }

  static calculateTotal(
    items: Array<{ price: number; quantity: number }>,
    discountPercent: number = 0,
    taxRate: number = 0,
    shipping: number = 0
  ): number {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    
    const afterDiscount = this.calculateDiscount(subtotal, discountPercent)
    const tax = this.calculateTax(afterDiscount, taxRate)
    
    return afterDiscount + tax + shipping
  }
}

// 字符串工具
class StringUtils {
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.slice(0, maxLength) + '...'
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  static wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  static reverse(text: string): string {
    return text.split('').reverse().join('')
  }
}

// ==================== 用户验证器测试 ====================

describe('UserValidator', () => {
  describe('validateEmail', () => {
    it('验证有效的邮箱地址', () => {
      expect(UserValidator.validateEmail('test@example.com')).toBe(true)
      expect(UserValidator.validateEmail('user.name@company.org')).toBe(true)
      expect(UserValidator.validateEmail('admin@test.co.uk')).toBe(true)
    })

    it('拒绝无效的邮箱地址', () => {
      expect(UserValidator.validateEmail('invalid')).toBe(false)
      expect(UserValidator.validateEmail('test@')).toBe(false)
      expect(UserValidator.validateEmail('@example.com')).toBe(false)
      expect(UserValidator.validateEmail('test@example')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('验证强密码', () => {
      const result = UserValidator.validatePassword('Password123!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('检测弱密码', () => {
      const result = UserValidator.validatePassword('weak')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('检测缺少大写字母的密码', () => {
      const result = UserValidator.validatePassword('password123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密码必须包含大写字母')
    })

    it('检测缺少数字的密码', () => {
      const result = UserValidator.validatePassword('Password!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密码必须包含数字')
    })
  })

  describe('validateUsername', () => {
    it('验证有效的用户名', () => {
      expect(UserValidator.validateUsername('john_doe')).toBe(true)
      expect(UserValidator.validateUsername('Alice123')).toBe(true)
      expect(UserValidator.validateUsername('test-user')).toBe(true)
    })

    it('拒绝无效的用户名', () => {
      expect(UserValidator.validateUsername('1invalid')).toBe(false)
      expect(UserValidator.validateUsername('ab')).toBe(false)
      expect(UserValidator.validateUsername('this_is_very_long_username')).toBe(false)
    })
  })
})

// ==================== 价格计算器测试 ====================

describe('PriceCalculator', () => {
  describe('calculateDiscount', () => {
    it('计算 10% 折扣', () => {
      expect(PriceCalculator.calculateDiscount(100, 10)).toBe(90)
    })

    it('计算 25% 折扣', () => {
      expect(PriceCalculator.calculateDiscount(200, 25)).toBe(150)
    })

    it('计算 0% 折扣', () => {
      expect(PriceCalculator.calculateDiscount(100, 0)).toBe(100)
    })

    it('计算 100% 折扣', () => {
      expect(PriceCalculator.calculateDiscount(100, 100)).toBe(0)
    })

    it('价格不能为负数', () => {
      expect(() => PriceCalculator.calculateDiscount(-100, 10)).toThrow('价格不能为负数')
    })

    it('折扣不能超过 100%', () => {
      expect(() => PriceCalculator.calculateDiscount(100, 101)).toThrow('折扣必须在 0-100 之间')
    })
  })

  describe('calculateTax', () => {
    it('计算 13% 增值税', () => {
      expect(PriceCalculator.calculateTax(100, 0.13)).toBe(13)
    })

    it('计算 6% 税率', () => {
      expect(PriceCalculator.calculateTax(100, 0.06)).toBe(6)
    })

    it('计算 0% 税率', () => {
      expect(PriceCalculator.calculateTax(100, 0)).toBe(0)
    })
  })

  describe('calculateShipping', () => {
    it('普通快递，小于 299 元', () => {
      expect(PriceCalculator.calculateShipping(100, 2, false)).toBe(14)
    })

    it('加急快递', () => {
      expect(PriceCalculator.calculateShipping(100, 2, true)).toBe(34)
    })

    it('满 299 元免运费', () => {
      expect(PriceCalculator.calculateShipping(300, 5, false)).toBe(0)
      expect(PriceCalculator.calculateShipping(300, 5, true)).toBe(0)
    })
  })

  describe('calculateTotal', () => {
    it('计算总价 (无折扣无税)', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 }
      ]
      const total = PriceCalculator.calculateTotal(items, 0, 0, 10)
      expect(total).toBe(360)
    })

    it('计算总价 (含折扣)', () => {
      const items = [{ price: 100, quantity: 2 }]
      const total = PriceCalculator.calculateTotal(items, 20, 0, 0)
      expect(total).toBe(160)
    })

    it('计算总价 (含折扣和税)', () => {
      const items = [{ price: 100, quantity: 2 }]
      const total = PriceCalculator.calculateTotal(items, 10, 0.13, 0)
      expect(total).toBe(203.4)
    })
  })
})

// ==================== 字符串工具测试 ====================

describe('StringUtils', () => {
  describe('truncate', () => {
    it('截断长文本', () => {
      expect(StringUtils.truncate('这是一段很长的文本', 5)).toBe('这是一段很...')
    })

    it('短文本不截断', () => {
      expect(StringUtils.truncate('短文本', 10)).toBe('短文本')
    })

    it('边界长度', () => {
      expect(StringUtils.truncate('12345', 5)).toBe('12345')
    })
  })

  describe('slugify', () => {
    it('转换中文标题', () => {
      expect(StringUtils.slugify('Hello World Example')).toBe('hello-world-example')
    })

    it('移除特殊字符', () => {
      expect(StringUtils.slugify('Hello! World@ Example#')).toBe('hello-world-example')
    })

    it('处理多余空格', () => {
      expect(StringUtils.slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('wordCount', () => {
    it('统计英文单词数', () => {
      expect(StringUtils.wordCount('Hello World Test')).toBe(3)
    })

    it('统计中文词数', () => {
      expect(StringUtils.wordCount('你好 世界 测试')).toBe(3)
    })

    it('空文本', () => {
      expect(StringUtils.wordCount('')).toBe(0)
      expect(StringUtils.wordCount('   ')).toBe(0)
    })
  })

  describe('reverse', () => {
    it('反转字符串', () => {
      expect(StringUtils.reverse('hello')).toBe('olleh')
    })

    it('反转中文', () => {
      expect(StringUtils.reverse('你好世界')).toBe('界世好你')
    })

    it('空字符串', () => {
      expect(StringUtils.reverse('')).toBe('')
    })
  })
})

console.log('✅ 单元测试示例加载成功！运行 bun test 查看结果')
