/**
 * PostgreSQL + Prisma 经典示例：电商订单系统（事务处理 + 锁机制）
 * 
 * 功能：
 * - 商品管理（SKU、库存）
 * - 购物车管理
 * - 订单创建（事务）
 * - 订单状态流转
 * - 库存扣减（乐观锁）
 * - 订单查询（多表关联）
 * - 销售统计
 * 
 * 技术栈：
 * - PostgreSQL 数据库
 * - Prisma ORM
 * - 事务处理（$transaction）
 * - 乐观锁/悲观锁
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 商品管理 ====================

async function createProduct(
  name: string,
  description: string,
  price: number,
  stock: number,
  categoryId: number
) {
  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      category: { connect: { id: categoryId } },
      skus: {
        create: [
          { sku: `${name.toUpperCase()}-S`, size: 'S', stock: stock / 3, priceModifier: 0 },
          { sku: `${name.toUpperCase()}-M`, size: 'M', stock: stock / 3, priceModifier: 0 },
          { sku: `${name.toUpperCase()}-L`, size: 'L', stock: stock / 3, priceModifier: 5 }
        ]
      }
    },
    include: {
      skus: true
    }
  });

  console.log('✅ 创建商品:', product.name);
  return product;
}

async function getProductStock(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      skus: true,
      _count: {
        select: { orderItems: true }
      }
    }
  });

  console.log(`📦 商品库存：${product?.name}, 库存：${product?.stock}`);
  return product;
}

// ==================== 购物车管理 ====================

async function addToCart(userId: number, productId: number, quantity: number, skuId?: number) {
  const cartItem = await prisma.cartItem.upsert({
    where: {
      userId_productId_skuId: {
        userId,
        productId,
        skuId: skuId || -1 // -1 表示无 SKU
      }
    },
    update: {
      quantity: { increment: quantity }
    },
    create: {
      userId,
      productId,
      skuId: skuId || undefined,
      quantity
    },
    include: {
      product: {
        select: {
          name: true,
          price: true,
          skus: true
        }
      }
    }
  });

  console.log('🛒 加入购物车:', cartItem.product.name, 'x', cartItem.quantity);
  return cartItem;
}

async function getCart(userId: number) {
  const cart = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          skus: true
        }
      },
      sku: true
    }
  });

  const total = cart.reduce((sum, item) => {
    const price = item.product.price + (item.sku?.priceModifier || 0);
    return sum + price * item.quantity;
  }, 0);

  console.log(`🛒 购物车：${cart.length} 件商品，总计：¥${total.toFixed(2)}`);

  return { items: cart, total };
}

async function removeFromCart(userId: number, productId: number) {
  await prisma.cartItem.deleteMany({
    where: { userId, productId }
  });

  console.log('🗑️  移出购物车：商品 ID', productId);
}

// ==================== 订单创建（事务处理） ====================

async function createOrder(userId: number, shippingAddress: string, paymentMethod: string) {
  // 使用事务处理订单创建
  const order = await prisma.$transaction(async (tx) => {
    // 1. 获取购物车
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
        sku: true
      }
    });

    if (cartItems.length === 0) {
      throw new Error('购物车为空');
    }

    // 2. 验证库存
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new Error(`商品 ${item.product.name} 库存不足`);
      }
    }

    // 3. 计算总价
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product.price + (item.sku?.priceModifier || 0);
      return sum + price * item.quantity;
    }, 0);

    // 4. 创建订单
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        shippingAddress,
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.product.price + (item.sku?.priceModifier || 0)
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            sku: true
          }
        }
      }
    });

    // 5. 扣减库存（乐观锁）
    for (const item of cartItems) {
      await tx.product.update({
        where: {
          id: item.productId,
          stock: { gte: item.quantity } // 乐观锁条件
        },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    // 6. 清空购物车
    await tx.cartItem.deleteMany({
      where: { userId }
    });

    console.log('✅ 订单创建成功:', order.orderNumber);
    return order;
  });

  return order;
}

// ==================== 订单状态流转 ====================

type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

async function updateOrderStatus(orderId: number, newStatus: OrderStatus) {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['SHIPPED', 'REFUNDED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: []
  };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true }
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  const allowedTransitions = statusFlow[order.status as OrderStatus];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`不允许的状态转换：${order.status} -> ${newStatus}`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });

  console.log(`📝 订单状态更新：${order.status} -> ${newStatus}`);
  return updated;
}

// ==================== 订单查询 ====================

async function getOrderById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          sku: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  console.log('📦 订单详情:', order?.orderNumber);
  return order;
}

async function getUserOrders(userId: number) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: {
          quantity: true,
          price: true,
          product: {
            select: {
              name: true,
              thumbnail: true
            }
          }
        }
      },
      _count: {
        select: { items: true }
      }
    }
  });

  console.log(`📦 用户订单：${orders.length} 个`);
  return orders;
}

async function getOrdersByStatus(status: OrderStatus) {
  const orders = await prisma.order.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      },
      items: {
        select: {
          quantity: true,
          price: true,
          product: {
            select: { name: true }
          }
        }
      }
    }
  });

  console.log(`📦 ${status} 订单：${orders.length} 个`);
  return orders;
}

// ==================== 销售统计 ====================

async function getSalesStats(startDate: Date, endDate: Date) {
  const stats = await prisma.order.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['PAID', 'SHIPPED', 'DELIVERED']
      }
    },
    _count: true,
    _sum: {
      totalAmount: true
    },
    _avg: {
      totalAmount: true
    }
  });

  // 按商品统计
  const productStats = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
      price: true
    },
    _count: true,
    where: {
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['PAID', 'SHIPPED', 'DELIVERED']
        }
      }
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 10
  });

  console.log('📊 销售统计:');
  console.log('订单数:', stats._count);
  console.log('总销售额:', stats._sum.totalAmount || 0);
  console.log('平均客单价:', stats._avg.totalAmount || 0);

  return {
    summary: stats,
    topProducts: productStats
  };
}

// ==================== 取消订单（回滚库存） ====================

async function cancelOrder(orderId: number) {
  await prisma.$transaction(async (tx) => {
    // 1. 获取订单
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === 'CANCELLED') {
      throw new Error('订单已取消');
    }

    if (order.status !== 'PENDING') {
      throw new Error('只有待支付订单可以取消');
    }

    // 2. 回滚库存
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity }
        }
      });
    }

    // 3. 更新订单状态
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    console.log('❌ 订单已取消:', orderId);
  });
}

// ==================== 主函数：演示流程 ====================

async function main() {
  console.log('🚀 PostgreSQL + Prisma 电商订单系统演示\n');

  // 1. 创建分类
  console.log('1️⃣  创建分类...');
  const clothing = await prisma.category.create({
    data: { name: '服装', slug: 'clothing' }
  });

  // 2. 创建商品
  console.log('\n2️⃣  创建商品...');
  const product1 = await createProduct(
    'T 恤',
    '纯棉 T 恤，舒适透气',
    99.00,
    100,
    clothing.id
  );

  const product2 = await createProduct(
    '牛仔裤',
    '经典直筒牛仔裤',
    299.00,
    50,
    clothing.id
  );

  // 3. 创建测试用户
  console.log('\n3️⃣  创建用户...');
  const user = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: '顾客',
      password: 'hashed_password',
      role: 'USER'
    }
  });

  // 4. 加入购物车
  console.log('\n4️⃣  加入购物车...');
  await addToCart(user.id, product1.id, 2); // 2 件 T 恤
  await addToCart(user.id, product2.id, 1, product1.skus[1]?.id); // 1 件牛仔裤（M 码）

  // 5. 查看购物车
  console.log('\n5️⃣  查看购物车...');
  const cart = await getCart(user.id);

  // 6. 创建订单
  console.log('\n6️⃣  创建订单...');
  const order = await createOrder(
    user.id,
    '北京市朝阳区 xxx 街道',
    'alipay'
  );

  // 7. 查看订单详情
  console.log('\n7️⃣  订单详情...');
  await getOrderById(order.id);

  // 8. 更新订单状态
  console.log('\n8️⃣  订单状态流转...');
  await updateOrderStatus(order.id, 'PAID');
  await updateOrderStatus(order.id, 'SHIPPED');

  // 9. 用户订单列表
  console.log('\n9️⃣  用户订单...');
  await getUserOrders(user.id);

  // 10. 待发货订单
  console.log('\n🔟  待发货订单...');
  await getOrdersByStatus('SHIPPED');

  // 11. 销售统计
  console.log('\n1️⃣1️⃣  销售统计...');
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // 过去 30 天
  await getSalesStats(startDate, new Date());

  console.log('\n✅ 所有演示完成！\n');
}

// 执行演示
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
