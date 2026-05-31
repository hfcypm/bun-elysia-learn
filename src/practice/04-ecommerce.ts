/**
 * 练习 3.1 - 电商商品 API
 * 
 * 学习目标:
 * - 实现复杂的商品数据模型
 * - 商品分类与标签管理
 * - 库存管理
 * - 价格计算与促销
 * 
 * 功能要求:
 * 1. 商品 CRUD
 * 2. 商品分类管理
 * 3. 库存增减
 * 4. 搜索与筛选
 * 5. 价格计算 (折扣、促销)
 */

import { Elysia, t } from 'elysia'

// 枚举定义
type Category = 'electronics' | 'clothing' | 'books' | 'home' | 'sports'
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

// 商品数据类型
interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number  // 原价 (用于显示折扣)
  category: Category
  tags: string[]
  stock: number
  sku: string  // 库存单位
  images: string[]
  rating: number  // 评分 (0-5)
  reviewCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 创建商品请求
interface CreateProductRequest {
  name: string
  description: string
  price: number
  originalPrice?: number
  category: Category
  tags?: string[]
  stock: number
  sku: string
  images?: string[]
}

// 库存存储
const products = new Map<number, Product>()
let nextId = 1
const LOW_STOCK_THRESHOLD = 10

// 初始化示例商品
const sampleProducts: CreateProductRequest[] = [
  {
    name: '无线蓝牙耳机',
    description: '高品质无线蓝牙耳机，降噪功能，续航 30 小时',
    price: 299,
    originalPrice: 399,
    category: 'electronics',
    tags: ['耳机', '无线', '蓝牙', '降噪'],
    stock: 50,
    sku: 'ELE-HEADPHONE-001',
    images: ['/images/headphone-1.jpg', '/images/headphone-2.jpg']
  },
  {
    name: '纯棉 T 恤',
    description: '100% 纯棉，舒适透气，多色可选',
    price: 99,
    category: 'clothing',
    tags: ['T 恤', '纯棉', '休闲'],
    stock: 200,
    sku: 'CLO-TSHIRT-001',
    images: ['/images/tshirt-1.jpg']
  },
  {
    name: 'Elysia.js 实战指南',
    description: '从零开始学习 Elysia.js 框架',
    price: 69,
    category: 'books',
    tags: ['编程', 'TypeScript', 'Web 开发'],
    stock: 8,
    sku: 'BOOK-ELYSIA-001',
    images: ['/images/book-elysia.jpg']
  }
]

sampleProducts.forEach(product => {
  const id = nextId++
  products.set(id, {
    ...product,
    id,
    rating: 4.5,
    reviewCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
})

// 辅助函数：计算库存状态
function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}

// 辅助函数：计算折扣率
function calculateDiscount(product: Product): number | null {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return null
  }
  return Math.round((1 - product.price / product.originalPrice) * 100)
}

const app = new Elysia()
  .group('/products', app => app
    // GET /products - 获取商品列表 (支持筛选和分页)
    .get('/', ({ query }) => {
      let result = Array.from(products.values())

      // 筛选：分类
      if (query.category) {
        result = result.filter(p => p.category === query.category)
      }

      // 筛选：标签
      if (query.tag) {
        const tags = Array.isArray(query.tag) ? query.tag : [query.tag]
        result = result.filter(p => p.tags.some(t => tags.includes(t)))
      }

      // 筛选：价格区间
      if (query.minPrice) {
        result = result.filter(p => p.price >= Number(query.minPrice))
      }
      if (query.maxPrice) {
        result = result.filter(p => p.price <= Number(query.maxPrice))
      }

      // 筛选：库存状态
      if (query.inStock === 'true') {
        result = result.filter(p => p.stock > 0)
      }

      // 筛选：活跃度
      if (query.active === 'false') {
        result = result.filter(p => !p.isActive)
      }

      // 搜索：关键词
      if (query.q) {
        const keyword = query.q.toLowerCase()
        result = result.filter(p =>
          p.name.toLowerCase().includes(keyword) ||
          p.description.toLowerCase().includes(keyword) ||
          p.tags.some(t => t.toLowerCase().includes(keyword))
        )
      }

      // 排序
      if (query.sort) {
        switch (query.sort) {
          case 'price_asc':
            result.sort((a, b) => a.price - b.price)
            break
          case 'price_desc':
            result.sort((a, b) => b.price - a.price)
            break
          case 'rating':
            result.sort((a, b) => b.rating - a.rating)
            break
          case 'newest':
            result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            break
        }
      }

      // 分页
      const page = Number(query.page) || 1
      const limit = Number(query.limit) || 20
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedProducts = result.slice(startIndex, endIndex)

      return {
        success: true,
        pagination: {
          page,
          limit,
          total: result.length,
          totalPages: Math.ceil(result.length / limit),
          hasMore: endIndex < result.length
        },
        data: paginatedProducts.map(p => ({
          ...p,
          stockStatus: getStockStatus(p.stock),
          discount: calculateDiscount(p)
        }))
      }
    })

    // GET /products/:id - 获取商品详情
    .get('/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        set.status = 400
        return { success: false, error: '无效的商品 ID' }
      }

      const product = products.get(id)
      
      if (!product) {
        set.status = 404
        return { success: false, error: '商品不存在' }
      }

      return {
        success: true,
        data: {
          ...product,
          stockStatus: getStockStatus(product.stock),
          discount: calculateDiscount(product)
        }
      }
    })

    // POST /products - 创建商品
    .post('', ({ body, set }) => {
      const { name, description, price, originalPrice, category, tags = [], stock, sku, images = [] } = body

      // 验证
      if (!name || !description || !price || !category || !sku) {
        set.status = 400
        return { success: false, error: '缺少必填字段' }
      }

      if (price < 0) {
        set.status = 400
        return { success: false, error: '价格不能为负数' }
      }

      if (originalPrice && originalPrice < price) {
        set.status = 400
        return { success: false, error: '原价不能低于现价' }
      }

      if (stock < 0) {
        set.status = 400
        return { success: false, error: '库存不能为负数' }
      }

      // 检查 SKU 是否重复
      for (const p of products.values()) {
        if (p.sku === sku) {
          set.status = 409
          return { success: false, error: 'SKU 已存在' }
        }
      }

      const product: Product = {
        id: nextId++,
        name,
        description,
        price,
        originalPrice,
        category,
        tags,
        stock,
        sku,
        images,
        rating: 0,
        reviewCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      products.set(product.id, product)

      set.status = 201
      return {
        success: true,
        message: '商品创建成功',
        data: {
          ...product,
          stockStatus: getStockStatus(product.stock),
          discount: calculateDiscount(product)
        }
      }
    })

    // PUT /products/:id - 更新商品
    .put('/:id', ({ params, body, set }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        set.status = 400
        return { success: false, error: '无效的商品 ID' }
      }

      const existing = products.get(id)
      
      if (!existing) {
        set.status = 404
        return { success: false, error: '商品不存在' }
      }

      // 检查 SKU 重复 (如果修改了 SKU)
      if (body.sku && body.sku !== existing.sku) {
        for (const p of products.values()) {
          if (p.sku === body.sku && p.id !== id) {
            set.status = 409
            return { success: false, error: 'SKU 已存在' }
          }
        }
      }

      const updated: Product = {
        ...existing,
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        price: body.price ?? existing.price,
        originalPrice: body.originalPrice ?? existing.originalPrice,
        category: body.category ?? existing.category,
        tags: body.tags ?? existing.tags,
        stock: body.stock ?? existing.stock,
        sku: body.sku ?? existing.sku,
        images: body.images ?? existing.images,
        isActive: body.isActive ?? existing.isActive,
        updatedAt: new Date()
      }

      // 验证
      if (updated.price < 0) {
        set.status = 400
        return { success: false, error: '价格不能为负数' }
      }

      if (updated.originalPrice && updated.originalPrice < updated.price) {
        set.status = 400
        return { success: false, error: '原价不能低于现价' }
      }

      products.set(id, updated)

      return {
        success: true,
        message: '商品更新成功',
        data: {
          ...updated,
          stockStatus: getStockStatus(updated.stock),
          discount: calculateDiscount(updated)
        }
      }
    })

    // PATCH /products/:id/stock - 更新库存
    .patch('/:id/stock', ({ params, body, set }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        set.status = 400
        return { success: false, error: '无效的商品 ID' }
      }

      const product = products.get(id)
      
      if (!product) {
        set.status = 404
        return { success: false, error: '商品不存在' }
      }

      const { operation, quantity } = body

      if (typeof quantity !== 'number' || quantity < 0) {
        set.status = 400
        return { success: false, error: '数量必须是非负数' }
      }

      let newStock: number
      
      switch (operation) {
        case 'add':
          newStock = product.stock + quantity
          break
        case 'remove':
          newStock = product.stock - quantity
          if (newStock < 0) {
            set.status = 400
            return { success: false, error: '库存不足' }
          }
          break
        case 'set':
          newStock = quantity
          break
        default:
          set.status = 400
          return { success: false, error: '无效的操作类型' }
      }

      product.stock = newStock
      product.updatedAt = new Date()
      products.set(id, product)

      return {
        success: true,
        message: '库存更新成功',
        data: {
          ...product,
          stockStatus: getStockStatus(product.stock)
        }
      }
    })

    // DELETE /products/:id - 删除商品
    .delete('/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        set.status = 400
        return { success: false, error: '无效的商品 ID' }
      }

      const deleted = products.delete(id)
      
      if (!deleted) {
        set.status = 404
        return { success: false, error: '商品不存在' }
      }

      return {
        success: true,
        message: '商品删除成功'
      }
    })
  )

  // GET /categories - 获取所有分类
  .get('/categories', () => {
    const categories: Category[] = ['electronics', 'clothing', 'books', 'home', 'sports']
    
    const categoryNames: Record<Category, string> = {
      electronics: '电子产品',
      clothing: '服装',
      books: '图书',
      home: '家居',
      sports: '运动'
    }

    const categoryStats = categories.map(cat => {
      const productsInCategory = Array.from(products.values()).filter(p => p.category === cat)
      return {
        id: cat,
        name: categoryNames[cat],
        productCount: productsInCategory.length,
        inStockCount: productsInCategory.filter(p => p.stock > 0).length
      }
    })

    return {
      success: true,
      data: categoryStats
    }
  })

  .listen(3005)

console.log('🛒 电商商品 API 运行在 http://localhost:3005')
console.log('📖 测试端点:')
console.log('   GET    /products - 获取商品列表')
console.log('   GET    /products?category=electronics&inStock=true - 筛选商品')
console.log('   GET    /products?q=耳机 - 搜索商品')
console.log('   GET    /products/1 - 获取商品详情')
console.log('   POST   /products - 创建商品')
console.log('   PUT    /products/1 - 更新商品')
console.log('   PATCH  /products/1/stock - 更新库存')
console.log('   DELETE /products/1 - 删除商品')
console.log('   GET    /categories - 获取分类统计')

export type EcommerceApp = typeof app
