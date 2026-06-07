/**
 * PostgreSQL + Prisma 示例：用户认证系统
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 配置 PostgreSQL 环境
 * 2. ✅ 使用 Prisma ORM
 * 3. ✅ 实现完整的用户注册/登录
 * 4. ✅ 生产环境配置
 * 
 * ⚠️ 注意事项：
 * - 需要运行 PostgreSQL 数据库
 * - 配置 DATABASE_URL 环境变量
 * - 先执行 prisma migrate
 * - 参考 POSTGRES_PRISMA_GUIDE 文档
 * 
 * 📝 练习任务：
 * - 实现完整的用户注册/登录
 * - PostgreSQL + Prisma 操作
 * - JWT Token 生成验证
 * 
 * 🔗 相关文档：
 * - docs/POSTGRES_PRISMA_GUIDE/00-README.md - 总索引
 * - docs/POSTGRES_PRISMA_GUIDE/01-GETTING_STARTED.md - 环境搭建
 * - docs/11-ELYSIA_PRISMA_INTEGRATION.md - 集成指南
 * 
 * 运行：bun run examples/08-postgres-prisma/auth-system.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-secret-key-change-in-production';

// ==================== 用户注册 ====================
async function registerUser(email: string, password: string, name: string) {
  try {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER' // 默认角色
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ 用户注册成功:', user);
    return user;
  } catch (error) {
    console.error('❌ 注册失败:', error);
    throw error;
  }
}

// ==================== 用户登录 ====================
async function loginUser(email: string, password: string) {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('密码错误');
    }

    // 生成 JWT Token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    console.log('✅ 登录成功');
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  } catch (error) {
    console.error('❌ 登录失败:', error);
    throw error;
  }
}

// ==================== 更新用户信息 ====================
async function updateUserProfile(userId: number, data: { name?: string; avatar?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar: data.avatar
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        updatedAt: true
      }
    });

    console.log('✅ 用户信息更新成功:', user);
    return user;
  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  }
}

// ==================== 修改密码 ====================
async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  try {
    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error('旧密码错误');
    }

    // 加密新密码并更新
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log('✅ 密码修改成功');
    return true;
  } catch (error) {
    console.error('❌ 密码修改失败:', error);
    throw error;
  }
}

// ==================== 密码重置（管理员） ====================
async function resetPassword(adminId: number, targetUserId: number, newPassword: string) {
  try {
    // 验证管理员权限
    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('权限不足');
    }

    // 加密新密码并重置
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedPassword }
    });

    console.log('✅ 密码重置成功');
    return true;
  } catch (error) {
    console.error('❌ 密码重置失败:', error);
    throw error;
  }
}

// ==================== 主函数：演示流程 ====================
async function main() {
  console.log('🚀 PostgreSQL + Prisma 认证系统演示\n');

  // 1. 注册新用户
  console.log('1️⃣  注册用户...');
  const newUser = await registerUser(
    'test@example.com',
    'password123',
    '测试用户'
  );

  // 2. 用户登录
  console.log('\n2️⃣  用户登录...');
  const loginResult = await loginUser('test@example.com', 'password123');
  console.log('Token:', loginResult.token.substring(0, 50) + '...');

  // 3. 更新用户信息
  console.log('\n3️⃣  更新用户信息...');
  await updateUserProfile(newUser.id, {
    name: '更新后的名字',
    avatar: 'https://example.com/avatar.jpg'
  });

  // 4. 修改密码
  console.log('\n4️⃣  修改密码...');
  await changePassword(newUser.id, 'password123', 'newpassword456');

  // 5. 使用新密码登录
  console.log('\n5️⃣  使用新密码登录...');
  const newLogin = await loginUser('test@example.com', 'newpassword456');
  console.log('新 Token:', newLogin.token.substring(0, 50) + '...');

  // 6. 管理员重置密码
  console.log('\n6️⃣  管理员重置密码...');
  // 先创建管理员
  const admin = await registerUser(
    'admin@example.com',
    'adminpass',
    '管理员'
  );
  await prisma.user.update({
    where: { id: admin.id },
    data: { role: 'ADMIN' }
  });
  
  await resetPassword(admin.id, newUser.id, 'resetpass789');
  const afterResetLogin = await loginUser('test@example.com', 'resetpass789');
  console.log('重置后 Token:', afterResetLogin.token.substring(0, 50) + '...');

  console.log('\n✅ 所有演示完成！\n');
}

// 执行演示
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
