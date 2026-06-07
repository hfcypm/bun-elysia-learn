/**
 * 示例片段: Prisma Ecommerce
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

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🛒 Prisma 基础入门 - 电商系统\n')

  // ==================== 1. 创建分类 ====================
  console.log('=== 1. 创建分类 ===')

  const cat1 = await prisma.category.create({ data: { name: '电子产品' } })
  const cat2 = await prisma.category.create({ data: { name: '图书' } })
  const cat3 = await prisma.category.create({ data: { name: '服装' } })
  console.log('创建分类:', [cat1, cat2, cat3], '\n')

  // ==================== 2. 创建商品 ====================
  console.log('=== 2. 创建商品 ===')

  const products = await prisma.product.createMany({
    data: [
      { name: 'iPhone 15', description: '苹果手机', price: 7999, stock: 100, categoryId: cat1.id },
      { name: 'MacBook Pro', description: '苹果笔记本', price: 12999, stock: 50, categoryId: cat1.id },
      { name: 'Prisma 实战', description: '技术书籍', price: 89, stock: 200, categoryId: cat2.id },
      { name: 'TypeScript 指南', description: '技术书籍', price: 79, stock: 150, categoryId: cat2.id },
      { name: 'T 恤', description: '纯棉 T 恤', price: 99, stock: 500, categoryId: cat3.id }
    ]
  })
  console.log(`创建了 ${products.count} 个商品\n`)

  // ==================== 3. 创建客户 ====================
  console.log('=== 3. 创建客户 ===')

  const customer1 = await prisma.customer.create({
    data: {
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000'
    }
  })
  console.log('创建客户 1:', customer1)

  const customer2 = await prisma.customer.create({
    data: {
      name: '李四',
      email: 'lisi@example.com',
      phone: '13900139000'
    }
  })
  console.log('创建客户 2:', customer2, '\n')

  // ==================== 4. 创建订单（事务） ====================
  console.log('=== 4. 创建订单（事务） ===')

  // 订单 1: 客户 1 购买 iPhone 和 T 恤
  const order1 = await prisma.$transaction(async (tx) => {
    // 创建订单
    const newOrder = await tx.order.create({
      data: {
        customerId: customer1.id,
        total: 0,
        status: 'pending'
      }
    })

    // 添加订单项 1: iPhone
    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: 1,
        quantity: 1,
        price: 7999
      }
    })

    // 扣减库存
    await tx.product.update({
      where: { id: 1 },
      data: { stock: { decrement: 1 } }
    })

    // 添加订单项 2: T 恤
    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: 5,
        quantity: 2,
        price: 99
      }
    })

    // 扣减库存
    await tx.product.update({
      where: { id: 5 },
      data: { stock: { decrement: 2 } }
    })

    // 计算总价
    const items = await tx.orderItem.findMany({
      where: { orderId: newOrder.id },
      include: { product: true }
    })

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // 更新订单总价
    await tx.order.update({
      where: { id: newOrder.id },
      data: { total }
    })

    return await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    })
  })
  console.log('订单 1:', order1)

  // 订单 2: 客户 2 购买图书
  const order2 = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        customerId: customer2.id,
        total: 0,
        status: 'pending'
      }
    })

    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: 3,
        quantity: 1,
        price: 89
      }
    })

    await tx.product.update({
      where: { id: 3 },
      data: { stock: { decrement: 1 } }
    })

    await tx.orderItem.create({
      data: {
        orderId: newOrder.id,
        productId: 4,
        quantity: 1,
        price: 79
      }
    })

    await tx.product.update({
      where: { id: 4 },
      data: { stock: { decrement: 1 } }
    })

    const total = 89 + 79

    await tx.order.update({
      where: { id: newOrder.id },
      data: { total }
    })

    return await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    })
  })
  console.log('订单 2:', order2, '\n')

  // ==================== 5. 更新订单状态 ====================
  console.log('=== 5. 更新订单状态 ===')

  await prisma.order.update({
    where: { id: order1!.id },
    data: { status: 'shipped' }
  })
  console.log('订单 1 已发货')

  await prisma.order.update({
    where: { id: order2!.id },
    data: { status: 'completed' }
  })
  console.log('订单 2 已完成\n')

  // ==================== 6. 统计查询 ====================
  console.log('=== 6. 统计查询 ===')

  // 总订单数
  const totalOrders = await prisma.order.count()
  console.log('总订单数:', totalOrders)

  // 总销售额
  const revenueStats = await prisma.order.aggregate({
    _sum: { total: true },
    _avg: { total: true },
    _min: { total: true },
    _max: { total: true }
  })
  console.log('销售统计:', revenueStats)

  // 每个分类的商品数
  const categoryStats = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true
        }
      }
    }
  })
  console.log('分类统计:', categoryStats)

  // 客户订单统计
  const customerStats = await prisma.customer.findMany({
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: {
          id: true,
          total: true,
          status: true
        }
      }
    }
  })
  console.log('客户统计:', customerStats, '\n')

  // ==================== 7. 库存预警 ====================
  console.log('=== 7. 库存预警 ===')

  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: 50
      }
    },
    select: {
      id: true,
      name: true,
      stock: true,
      category: {
        select: { name: true }
      }
    }
  })
  console.log('库存预警商品:', lowStockProducts, '\n')

  // ==================== 8. 查询订单详情 ====================
  console.log('=== 8. 查询订单详情 ===')

  const orderDetail = await prisma.order.findUnique({
    where: { id: order1!.id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    }
  })
  console.log('订单详情:', JSON.stringify(orderDetail, null, 2), '\n')

  // ==================== 9. 按分类统计销售 ====================
  console.log('=== 9. 按分类统计销售 ===')

  const categorySales = await prisma.category.findMany({
    include: {
      products: {
        include: {
          orderItems: {
            select: {
              quantity: true,
              price: true
            }
          }
        }
      }
    }
  })

  const salesByCategory = categorySales.map(cat => ({
    category: cat.name,
    totalQuantity: cat.products.reduce(
      (sum, product) => sum + product.orderItems.reduce((s, item) => s + item.quantity, 0),
      0
    ),
    totalRevenue: cat.products.reduce(
      (sum, product) => sum + product.orderItems.reduce((s, item) => s + item.price * item.quantity, 0),
      0
    )
  }))

  console.log('分类销售统计:', salesByCategory, '\n')

  console.log('✅ 电商系统示例完成！')
}

main()
  .catch((error) => {
    console.error('❌ 错误:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export {}
