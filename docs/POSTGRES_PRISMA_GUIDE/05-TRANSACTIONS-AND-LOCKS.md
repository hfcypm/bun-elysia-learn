# 阶段五：事务与锁机制

> 学习时间：3 小时 | 难度：⭐⭐⭐⭐⭐

---

## 5.1 事务基础

### 什么是事务？

事务（Transaction）是一系列数据库操作的集合，这些操作要么**全部成功**，要么**全部失败**，保证数据的一致性。

### ACID 特性

| 特性 | 说明 | 示例 |
|------|------|------|
| **原子性（Atomicity）** | 事务中的操作要么全部完成，要么全部不完成 | 转账：A 扣款 + B 加款，要么都成功，要么都失败 |
| **一致性（Consistency）** | 事务执行前后，数据库状态保持一致 | 转账前后总金额不变 |
| **隔离性（Isolation）** | 多个事务并发执行时互不干扰 | A 转账时，其他人看不到中间状态 |
| **持久性（Durability）** | 事务提交后，结果是永久的 | 转账成功后，即使断电数据也不丢失 |

---

## 5.2 Prisma 事务使用方式

### 方式一：$transaction (数组方式)

适合：**多个独立操作**需要原子性执行

```typescript
// 同时创建用户和文章
const [user, post] = await prisma.$transaction([
  prisma.user.create({
    data: { email: 'test@example.com', name: '张三' }
  }),
  prisma.post.create({
    data: { title: '文章', content: '内容', authorId: 1 }
  })
]);

console.log(user, post);
```

**特点：**
- ✅ 语法简洁
- ✅ 并行执行（性能好）
- ⚠️ 操作之间不能有依赖关系

### 方式二：$transaction (回调方式)

适合：**有依赖关系**的多个操作

```typescript
// 创建用户后为其创建文章（有依赖关系）
const result = await prisma.$transaction(async (tx) => {
  // 1. 创建用户
  const user = await tx.user.create({
    data: { email: 'test@example.com', name: '张三' }
  });
  
  // 2. 使用创建的 user id 创建文章
  const post = await tx.post.create({
    data: {
      title: '文章',
      content: '内容',
      authorId: user.id  // 依赖上一步的结果
    }
  });
  
  // 3. 更新用户统计
  const updatedUser = await tx.user.update({
    where: { id: user.id },
    data: { postCount: 1 }
  });
  
  return { user, post, updatedUser };  // 返回所有结果
});

console.log(result.user, result.post, result.updatedUser);
```

**特点：**
- ✅ 操作之间可以有依赖
- ✅ 更灵活的控制
- ⚠️ 串行执行（性能稍差）

---

## 5.3 实战示例：电商订单系统

### 完整订单流程

```typescript
// 示例代码：examples/postgres-prisma/ecommerce-order.ts

async function createOrder(userId: number, shippingAddress: string) {
  return await prisma.$transaction(async (tx) => {
    // 步骤 1：获取购物车
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
    
    // 步骤 2：验证库存
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new Error(`商品 ${item.product.name} 库存不足`);
      }
    }
    
    // 步骤 3：计算总价
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product.price + (item.sku?.priceModifier || 0);
      return sum + price * item.quantity;
    }, 0);
    
    // 步骤 4：创建订单
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
        items: true
      }
    });
    
    // 步骤 5：扣减库存（乐观锁）
    for (const item of cartItems) {
      await tx.product.update({
        where: {
          id: item.productId,
          stock: { gte: item.quantity }  // ⚠️ 乐观锁条件
        },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }
    
    // 步骤 6：清空购物车
    await tx.cartItem.deleteMany({
      where: { userId }
    });
    
    return order;
  });
}
```

### 关键点解析

**1. 使用 tx 而非 prisma**
```typescript
// ✅ 正确：使用事务对象 tx
const user = await tx.user.create({...});

// ❌ 错误：直接使用 prisma
const user = await prisma.user.create({...});  // 不在事务中
```

**2. 抛出异常触发回滚**
```typescript
if (cartItems.length === 0) {
  throw new Error('购物车为空');  // 事务回滚
}
```

**3. 所有步骤要么全成功，要么全失败**
- 如果步骤 5 库存扣减失败，步骤 4 的订单也会被回滚
- 购物车不会清空

---

## 5.4 乐观锁（Optimistic Locking）

### 什么是乐观锁？

乐观锁假设**并发冲突很少发生**，只在更新时检查数据是否被修改过。

### 实现方式：条件更新

```typescript
// 扣减库存（防止超卖）
await tx.product.update({
  where: {
    id: productId,
    stock: { gte: quantity }  // ⚠️ 条件：库存 >= 购买数量
  },
  data: {
    stock: { decrement: quantity }
  }
});
```

### 工作原理

```
1. 读取商品库存：stock = 10

2. 用户 A 购买 6 个
   where: { id: 1, stock: { gte: 6 } }  // 10 >= 6 ✅
   stock: { decrement: 6 }  // stock = 4

3. 用户 B 购买 5 个
   where: { id: 1, stock: { gte: 5 } }  // 4 >= 5 ❌
   // 更新失败，抛出异常

4. 用户 B 订单回滚，库存恢复
```

### 处理乐观锁失败

```typescript
try {
  const result = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: {
        id: productId,
        stock: { gte: quantity }
      },
      data: {
        stock: { decrement: quantity }
      }
    });
  });
  
  console.log('购买成功');
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {  // 记录不存在或条件不满足
      console.log('库存不足，购买失败');
    }
  }
}
```

---

## 5.5 悲观锁（Pessimistic Locking）

### 什么是悲观锁？

悲观锁假设**并发冲突经常发生**，在操作开始时就锁定数据。

### Prisma 中的悲观锁

```typescript
// 使用 forUpdate 锁定记录
const order = await prisma.order.findUnique({
  where: { id: orderId },
  lock: {
    mode: 'FOR UPDATE'  // 排他锁，其他事务不能读取或更新
  }
});

// 在事务中使用
await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUnique({
    where: { id: 1 },
    lock: { mode: 'FOR UPDATE' }  // 锁定商品
  });
  
  // 其他事务必须等待此事务完成才能访问该商品
  await tx.product.update({
    where: { id: product.id },
    data: { stock: { decrement: 1 } }
  });
});
```

### 锁模式对比

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| `FOR UPDATE` | 排他锁，禁止其他事务读写 | 更新库存、扣款 |
| `FOR SHARE` | 共享锁，允许读禁止写 | 余额查询 |
| `FOR NO KEY UPDATE` | 类似 FOR UPDATE，但不锁外键 | 普通更新 |
| `FOR KEY SHARE` | 只锁外键关联 | 删除检查 |

---

## 5.6 事务超时与重试

### 设置超时时间

```typescript
await prisma.$transaction(
  async (tx) => {
    // 业务逻辑
  },
  {
    timeout: 10000,  // 10 秒超时（默认 5 秒）
    isolationLevel: 'ReadCommitted'  // 事务隔离级别
  }
);
```

### 事务隔离级别

```typescript
enum IsolationLevel {
  ReadUncommitted,  // 最低：可能读到未提交的数据
  ReadCommitted,    // 默认：只读已提交的数据
  RepeatableRead,   // 可重复读
  Serializable      // 最高：串行化
}
```

### 重试机制

```typescript
async function createOrderWithRetry(userId: number, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 可能失败的逻辑
        const order = await createOrder(tx, userId);
        return order;
      });
    } catch (error) {
      if (i === maxRetries - 1) throw error;  // 最后一次失败
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}
```

---

## 5.7 回滚与撤销

### 订单取消（库存回滚）

```typescript
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
          stock: { increment: item.quantity }  // 库存增加
        }
      });
    }
    
    // 3. 更新订单状态
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
  });
}
```

---

## 5.8 错误处理

### Prisma 错误码

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.$transaction(async (tx) => {
    // 业务逻辑
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        console.log('记录不存在或条件不满足');
        break;
      case 'P2034':  // 事务冲突
        console.log('事务冲突，请重试');
        break;
      case 'P2028':  // 事务超时
        console.log('事务超时');
        break;
      default:
        console.log('数据库错误:', error.message);
    }
  } else {
    console.log('其他错误:', error);
  }
}
```

---

## 📝 练习 5.1：转账系统

**任务：** 实现银行转账功能

**要求：**
1. 使用事务保证 A 扣款 + B 加款原子性
2. 检查余额是否充足
3. 记录转账流水
4. 处理并发转账（使用锁）

**Schema 提示：**
```prisma
model Account {
  id      Int     @id @default(autoincrement())
  userId  Int
  balance Decimal @db.Decimal(10, 2)
  transactions Transaction[]
}

model Transaction {
  id          Int      @id @default(autoincrement())
  fromAccountId Int
  toAccountId   Int
  amount      Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  
  fromAccount Account @relation(...)
  toAccount   Account @relation(...)
}
```

**答案框架：**
```typescript
async function transfer(fromId: number, toId: number, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. 锁定付款账户（悲观锁）
    const fromAccount = await tx.account.findUnique({
      where: { id: fromId },
      lock: { mode: 'FOR UPDATE' }
    });
    
    // 2. 检查余额
    if (fromAccount.balance < amount) {
      throw new Error('余额不足');
    }
    
    // 3. 扣款
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } }
    });
    
    // 4. 加款
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } }
    });
    
    // 5. 记录流水
    await tx.transaction.create({
      data: {
        fromAccountId: fromId,
        toAccountId: toId,
        amount: amount
      }
    });
  });
}
```

---

## 📝 练习 5.2：秒杀系统

**任务：** 实现商品秒杀功能

**要求：**
1. 高并发下库存准确（不超卖）
2. 一人只能购买一次
3. 使用乐观锁或悲观锁
4. 创建订单和扣减库存原子性

**提示：** 参考电商订单示例，添加库存检查和购买限制

---

## 📚 阶段五总结

### 知识点回顾

| 知识点 | 重要程度 | 掌握要求 |
|--------|----------|----------|
| $transaction 数组方式 | ⭐⭐⭐⭐ | 熟练 |
| $transaction 回调方式 | ⭐⭐⭐⭐⭐ | 精通 |
| 乐观锁实现 | ⭐⭐⭐⭐⭐ | 精通 |
| 悲观锁使用 | ⭐⭐⭐⭐ | 熟练 |
| 事务错误处理 | ⭐⭐⭐⭐⭐ | 精通 |
| 事务超时配置 | ⭐⭐⭐ | 熟悉 |
| 回滚与撤销 | ⭐⭐⭐⭐⭐ | 精通 |

### 下一步

完成本章后，你应该能够：
- ✅ 使用事务保证数据一致性
- ✅ 实现乐观锁和悲观锁
- ✅ 处理事务错误和重试

准备好进入**阶段六：实战项目综合**！

---

## 🔗 参考资源

- [Prisma 事务文档](https://prisma.io/docs/concepts/components/prisma-client/transactions)
- [事务隔离级别](https://prisma.io/docs/concepts/components/prisma-client/transactions#isolation-level)
- [示例代码 - 电商订单](../../examples/postgres-prisma/ecommerce-order.ts)
