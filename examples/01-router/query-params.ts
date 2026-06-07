/**
 * 示例片段: Query Params
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习路由的具体用法
 * 2. ✅ 理解不同路由类型的区别
 * 3. ✅ 可以组合到项目中
 * 4. ✅ 根据需求调整配置
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3102，被占用请修改
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
 * 运行：bun run examples/01-router/query-params.ts
 * 测试：http://localhost:3102
 */

import { Elysia } from 'elysia'

// 模拟商品数据
const products = [
  { id: 1, name: 'iPhone 15', price: 6999, category: 'electronics', stock: 100 },
  { id: 2, name: 'MacBook Pro', price: 12999, category: 'electronics', stock: 50 },
  { id: 3, name: 'T 恤', price: 99, category: 'clothing', stock: 500 },
  { id: 4, name: '牛仔裤', price: 299, category: 'clothing', stock: 300 },
  { id: 5, name: '咖啡杯', price: 49, category: 'home', stock: 1000 }
]

const app = new Elysia()
  // 基础查询参数
  .get('/search', ({ query }) => {
    return {
      message: '搜索接口',
      received: query,
      tip: '访问 /search?keyword=手机&page=1'
    }
  })

  // 商品搜索 - 多参数筛选
  .get('/products', ({ query }) => {
    let result = [...products]

    // 按关键词搜索
    if (query.keyword) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(query.keyword.toLowerCase())
      )
    }

    // 按分类筛选
    if (query.category) {
      result = result.filter(p => p.category === query.category)
    }

    // 按价格范围筛选
    if (query.minPrice) {
      result = result.filter(p => p.price >= query.minPrice)
    }
    if (query.maxPrice) {
      result = result.filter(p => p.price <= query.maxPrice)
    }

    // 分页
    const page = query.page || 1
    const limit = query.limit || 10
    const start = (page - 1) * limit
    const end = start + limit

    return {
      success: true,
      data: result.slice(start, end),
      pagination: {
        page,
        limit,
        total: result.length,
        showing: `${start + 1}-${Math.min(end, result.length)}`
      },
      filters: {
        keyword: query.keyword,
        category: query.category,
        priceRange: query.minPrice && query.maxPrice 
          ? `${query.minPrice}-${query.maxPrice}` 
          : '无限制'
      }
    }
  })

  // 可选查询参数
  .get('/items', ({ query }) => {
    return {
      message: '可选参数示例',
      sort: query.sort || 'default',
      order: query.order || 'asc',
      fields: query.fields || 'all'
    }
  })

app.listen(3102, () => {
  console.log('🚀 服务器运行在 http://localhost:3102')
  console.log('📝 测试接口:')
  console.log('   GET /search?keyword=手机&page=1')
  console.log('   GET /products?category=electronics')
  console.log('   GET /products?minPrice=100&maxPrice=1000')
  console.log('   GET /products?keyword=Pro&category=electronics&page=1&limit=5')
  console.log('   GET /items?sort=price&order=desc&fields=name,price')
})
