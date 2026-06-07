# Elysia.js + Prisma + PostgreSQL 完整集成指南 🦊🐘

> 从零开始搭建生产级 API 的完整教程  
> **预计时间**: 30 分钟 | **难度**: ⭐⭐⭐ | **适用**: 生产环境

---

## 📋 目录

1. [项目初始化](#1-项目初始化)
2. [安装依赖](#2-安装依赖)
3. [配置 Prisma](#3-配置-prisma)
4. [设计数据模型](#4-设计数据模型)
5. [数据库迁移](#5-数据库迁移)
6. [集成 Elysia](#6-集成-elysia)
7. [完整 CRUD 示例](#7-完整-crud-示例)
8. [最佳实践](#8-最佳实践)
9. [常见问题](#9-常见问题)

---

## 1. 项目初始化

### 1.1 创建新项目

```bash
# 创建项目目录
mkdir elysia-prisma-demo
cd elysia-prisma-demo

# 初始化 package.json
bun init -y
```

### 1.2 配置 TypeScript

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.3 创建项目结构

```bash
# 创建目录结构
mkdir -p src/{routes,controllers,services,middleware,utils}
mkdir -p prisma
```

**推荐项目结构：**

```
elysia-prisma-demo/
├── src/
│   ├── routes/           # 路由定义
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   └── index.ts          # 入口文件
├── prisma/
│   ├── schema.prisma     # 数据模型
│   └── migrations/       # 迁移文件
├── .env                  # 环境变量
├── package.json
└── tsconfig.json
```

---

## 2. 安装依赖

### 2.1 安装核心依赖

```bash
# 安装 Elysia 框架
bun add elysia

# 安装 Prisma 和相关依赖
bun add prisma @prisma/client --dev
bun add @elysiajs/cors @elysiajs/swagger
```

### 2.2 安装开发工具

```bash
# 安装类型定义
bun add -d @types/node typescript
```

### 2.3 配置 package.json 脚本

```json
{
  "name": "elysia-prisma-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "build": "tsc",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:seed": "bun run prisma/seed.ts"
  },
  "dependencies": {
    "@elysiajs/cors": "^1.1.0",
    "@elysiajs/swagger": "^1.1.0",
    "@prisma/client": "^5.0.0",
    "elysia": "^1.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  },
  "prisma": {
    "seed": "bun run prisma/seed.ts"
  }
}
```

---

## 3. 配置 Prisma

### 3.1 初始化 Prisma

```bash
# 初始化 Prisma（选择 PostgreSQL）
bun x prisma init --datasource-provider postgresql
```

生成的文件：
- `prisma/schema.prisma` - 数据模型定义
- `.env` - 环境变量（包含数据库连接字符串）

### 3.2 配置数据库连接

编辑 `.env` 文件：

```env
# PostgreSQL 连接字符串
# 格式：postgresql://用户名:密码@主机:端口/数据库名?schema=public

DATABASE_URL="postgresql://postgres:your_password@localhost:5432/elysia_demo?schema=public"

# 其他配置
NODE_ENV="development"
PORT="3000"
```

### 3.3 本地开发替代方案（可选）

如果本地没有 PostgreSQL，可以使用 Docker：

```bash
# 使用 Docker 运行 PostgreSQL
docker run -d \
  --name elysia-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=elysia_demo \
  -p 5432:5432 \
  postgres:15-alpine
```

更新 `.env`：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elysia_demo?schema=public"
```

---

## 4. 设计数据模型

### 4.1 基础用户模型

编辑 `prisma/schema.prisma`：

```prisma
// 数据源配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 生成器配置
generator client {
  provider = "prisma-client-js"
}

// ==================== 用户模型 ====================

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联
  posts Post[]
  profile UserProfile?
  
  // 索引
  @@index([email])
  @@index([role])
}

// 用户资料
model UserProfile {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  avatar    String?
  bio       String?  @db.Text
  phone     String?
  website   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// 文章模型
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String   @db.Text
  excerpt   String?
  isPublished Boolean @default(false)
  views     Int      @default(0)
  publishedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联
  authorId   Int
  author     User      @relation(fields: [authorId], references: [id])
  tags       PostTag[]
  comments   Comment[]
  
  // 索引
  @@index([authorId])
  @@index([slug])
  @@index([isPublished])
}

// 标签模型
model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  slug  String @unique
  posts PostTag[]
  
  @@index([slug])
}

// 文章 - 标签关联表（多对多）
model PostTag {
  id        Int      @id @default(autoincrement())
  postId    Int
  tagId     Int
  createdAt DateTime @default(now())
  
  // 关联
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([postId, tagId])
  @@index([postId])
  @@index([tagId])
}

// 评论模型
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  parentId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联
  postId    Int
  post      Post      @relation(fields: [postId], references: [id])
  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  
  // 索引
  @@index([postId])
  @@index([authorId])
  @@index([parentId])
}

// 角色枚举
enum Role {
  USER
  ADMIN
  EDITOR
}
```

### 4.2 模型说明

| 模型 | 说明 | 关键字段 |
|------|------|----------|
| User | 用户 | email(唯一), password, role |
| UserProfile | 用户资料 | userId(唯一), avatar, bio |
| Post | 文章 | title, slug(唯一), authorId |
| Tag | 标签 | name(唯一), slug(唯一) |
| PostTag | 文章标签关联 | postId, tagId(复合唯一) |
| Comment | 评论 | postId, authorId, parentId(自关联) |

---

## 5. 数据库迁移

### 5.1 生成 Prisma Client

```bash
# 生成类型安全的 Prisma Client
bun run db:generate
```

输出：
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

### 5.2 创建数据库迁移

```bash
# 开发环境：创建并应用迁移
bun run db:migrate
```

交互式提示：

```
? What would you like to call this migration?
> init_users_and_posts
```

**迁移过程：**

1. 分析 schema.prisma 变化
2. 生成 SQL 迁移文件
3. 应用迁移到数据库
4. 生成新的 Prisma Client

### 5.3 查看迁移文件

生成的文件位于 `prisma/migrations/YYYYMMDDHHMMSS_init_users_and_posts/`：

```sql
-- prisma/migrations/.../migration.sql

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

### 5.4 生产环境部署

```bash
# 生产环境：只应用迁移，不创建新迁移
bun run db:migrate:prod
```

### 5.5 打开 Prisma Studio

```bash
# 可视化查看和管理数据
bun run db:studio
```

浏览器打开：http://localhost:5555

---

## 6. 集成 Elysia

### 6.1 创建 Prisma 单例

创建 `src/utils/prisma.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

// 单例模式，避免重复连接
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### 6.2 创建基础 Elysia 应用

创建 `src/index.ts`：

```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { prisma } from './utils/prisma';
import { userRoutes } from './routes/user';
import { postRoutes } from './routes/post';

const app = new Elysia()
  // 启用 CORS
  .use(cors())
  
  // 启用 Swagger 文档
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'Elysia + Prisma API',
        version: '1.0.0',
        description: '基于 Elysia.js 和 Prisma 的 RESTful API'
      },
      tags: [
        { name: 'User', description: '用户管理' },
        { name: 'Post', description: '文章管理' }
      ]
    }
  }))
  
  // 健康检查
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  }))
  
  // 注册路由
  .use(userRoutes)
  .use(postRoutes)
  
  // 启动服务器
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// 优雅关闭
process.on('SIGINT', () => {
  app.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  app.stop();
  process.exit(0);
});
```

### 6.3 创建响应格式工具

创建 `src/utils/response.ts`：

```typescript
// 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    error
  };
}

export function paginatedResponse<T>(
  data: T,
  page: number,
  limit: number,
  total: number
): ApiResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

---

## 7. 完整 CRUD 示例

### 7.1 用户模块

#### 用户服务层

创建 `src/services/user.service.ts`：

```typescript
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import type { User, UserProfile, Prisma } from '@prisma/client';

export class UserService {
  // ==================== 创建用户 ====================
  
  async createUser(data: {
    email: string;
    password: string;
    name?: string;
    profile?: Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  }): Promise<User> {
    // 密码加密
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        profile: data.profile ? {
          create: data.profile
        } : undefined
      },
      include: {
        profile: true
      }
    });
  }
  
  // ==================== 查询用户 ====================
  
  async getUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        _count: {
          select: { posts: true }
        }
      }
    });
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
  }
  
  async getUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          profile: {
            select: {
              avatar: true,
              bio: true
            }
          },
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);
    
    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // ==================== 更新用户 ====================
  
  async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      isActive?: boolean;
      profile?: {
        avatar?: string;
        bio?: string;
        phone?: string;
        website?: string;
      };
    }
  ): Promise<User> {
    const { profile, ...userData } = data;
    
    return await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: profile ? {
          upsert: {
            create: profile,
            update: profile
          }
        } : undefined
      },
      include: { profile: true }
    });
  }
  
  // ==================== 删除用户 ====================
  
  async deleteUser(id: number): Promise<User> {
    return await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
  }
  
  // ==================== 用户认证 ====================
  
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isValid = await this.validatePassword(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

export const userService = new UserService();
```

#### 用户路由

创建 `src/routes/user.ts`：

```typescript
import { Elysia, t } from 'elysia';
import { userService } from '../services/user.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const userRoutes = new Elysia({ prefix: '/api/users' })
  // ==================== 获取用户列表 ====================
  .get('/', async ({ query }) => {
    const page = query.page || 1;
    const limit = query.limit || 10;
    
    const result = await userService.getUsers(page, limit);
    
    return paginatedResponse(result.data, page, limit, result.pagination.total);
  }, {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 }))
    }),
    detail: {
      tags: ['User'],
      summary: '获取用户列表'
    }
  })
  
  // ==================== 获取单个用户 ====================
  .get('/:id', async ({ params }) => {
    const user = await userService.getUserById(params.id);
    
    if (!user) {
      return errorResponse('用户不存在', 'USER_NOT_FOUND');
    }
    
    return successResponse(user);
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    detail: {
      tags: ['User'],
      summary: '获取用户详情'
    }
  })
  
  // ==================== 创建用户 ====================
  .post('/', async ({ body }) => {
    try {
      const user = await userService.createUser(body);
      
      // 移除密码
      const { password, ...userWithoutPassword } = user;
      
      return successResponse(userWithoutPassword, '用户创建成功');
    } catch (error: any) {
      if (error.code === 'P2002') {
        return errorResponse('邮箱已被注册', 'EMAIL_EXISTS');
      }
      return errorResponse('创建失败', error.message);
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      name: t.Optional(t.String()),
      profile: t.Optional(t.Object({
        avatar: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        website: t.Optional(t.String())
      }))
    }),
    detail: {
      tags: ['User'],
      summary: '创建用户'
    }
  })
  
  // ==================== 更新用户 ====================
  .put('/:id', async ({ params, body }) => {
    try {
      const user = await userService.updateUser(params.id, body);
      
      const { password, ...userWithoutPassword } = user;
      
      return successResponse(userWithoutPassword, '用户更新成功');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('用户不存在', 'USER_NOT_FOUND');
      }
      return errorResponse('更新失败', error.message);
    }
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String({ format: 'email' })),
      isActive: t.Optional(t.Boolean()),
      profile: t.Optional(t.Object({
        avatar: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        website: t.Optional(t.String())
      }))
    }),
    detail: {
      tags: ['User'],
      summary: '更新用户'
    }
  })
  
  // ==================== 删除用户 ====================
  .delete('/:id', async ({ params }) => {
    try {
      await userService.deleteUser(params.id);
      return successResponse(null, '用户已删除');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('用户不存在', 'USER_NOT_FOUND');
      }
      return errorResponse('删除失败', error.message);
    }
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    detail: {
      tags: ['User'],
      summary: '删除用户'
    }
  });
```

---

### 7.2 文章模块

#### 文章服务层

创建 `src/services/post.service.ts`：

```typescript
import { prisma } from '../utils/prisma';
import type { Post, Prisma } from '@prisma/client';

interface CreatePostInput {
  title: string;
  content: string;
  authorId: number;
  excerpt?: string;
  tags?: string[];
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  isPublished?: boolean;
  tags?: string[];
}

export class PostService {
  // ==================== 创建文章 ====================
  
  async createPost(data: CreatePostInput): Promise<Post> {
    // 生成 slug
    const slug = this.generateSlug(data.title);
    
    return await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        authorId: data.authorId,
        tags: data.tags ? {
          create: data.tags.map(name => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: {
                  name,
                  slug: this.generateSlug(name)
                }
              }
            }
          }))
        } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
  }
  
  // ==================== 查询文章 ====================
  
  async getPostById(id: number): Promise<Post | null> {
    return await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            _count: {
              select: { replies: true }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    });
  }
  
  async getPosts(
    page: number = 1,
    limit: number = 10,
    filters?: {
      authorId?: number;
      tagId?: number;
      isPublished?: boolean;
      search?: string;
    }
  ) {
    const where: Prisma.PostWhereInput = {};
    
    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }
    
    if (filters?.tagId) {
      where.tags = { some: { tagId: filters.tagId } };
    }
    
    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } }
      ];
    }
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          isPublished: true,
          views: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatar: true }
              }
            }
          },
          tags: {
            select: {
              tag: {
                select: { id: true, name: true, slug: true }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.post.count({ where })
    ]);
    
    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // ==================== 更新文章 ====================
  
  async updatePost(id: number, data: UpdatePostInput): Promise<Post> {
    return await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
        tags: data.tags ? {
          set: [],
          create: data.tags.map(name => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: {
                  name,
                  slug: this.generateSlug(name)
                }
              }
            }
          }))
        } : undefined
      },
      include: {
        tags: {
          select: {
            tag: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });
  }
  
  // ==================== 删除文章 ====================
  
  async deletePost(id: number): Promise<Post> {
    return await prisma.post.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true
      }
    });
  }
  
  // ==================== 增加浏览量 ====================
  
  async incrementViews(id: number): Promise<Post> {
    return await prisma.post.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    });
  }
  
  // ==================== 工具方法 ====================
  
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const postService = new PostService();
```

#### 文章路由

创建 `src/routes/post.ts`：

```typescript
import { Elysia, t } from 'elysia';
import { postService } from '../services/post.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

export const postRoutes = new Elysia({ prefix: '/api/posts' })
  // ==================== 获取文章列表 ====================
  .get('/', async ({ query }) => {
    const page = query.page || 1;
    const limit = query.limit || 10;
    
    const filters: any = {
      isPublished: true // 只获取已发布的文章
    };
    
    if (query.authorId) filters.authorId = parseInt(query.authorId);
    if (query.tagId) filters.tagId = parseInt(query.tagId);
    if (query.search) filters.search = query.search;
    
    const result = await postService.getPosts(page, limit, filters);
    
    return paginatedResponse(result.data, page, limit, result.pagination.total);
  }, {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
      authorId: t.Optional(t.String()),
      tagId: t.Optional(t.String()),
      search: t.Optional(t.String())
    }),
    detail: {
      tags: ['Post'],
      summary: '获取文章列表'
    }
  })
  
  // ==================== 获取文章详情 ====================
  .get('/:id', async ({ params }) => {
    // 增加浏览量
    await postService.incrementViews(params.id);
    
    const post = await postService.getPostById(params.id);
    
    if (!post) {
      return errorResponse('文章不存在', 'POST_NOT_FOUND');
    }
    
    return successResponse(post);
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    detail: {
      tags: ['Post'],
      summary: '获取文章详情'
    }
  })
  
  // ==================== 获取文章 By Slug ====================
  .get('/slug/:slug', async ({ params }) => {
    const post = await postService.getPostBySlug(params.slug);
    
    if (!post) {
      return errorResponse('文章不存在', 'POST_NOT_FOUND');
    }
    
    return successResponse(post);
  }, {
    params: t.Object({
      slug: t.String()
    }),
    detail: {
      tags: ['Post'],
      summary: '通过 Slug 获取文章'
    }
  })
  
  // ==================== 创建文章 ====================
  .post('/', async ({ body }) => {
    try {
      const post = await postService.createPost(body);
      return successResponse(post, '文章创建成功');
    } catch (error: any) {
      return errorResponse('创建失败', error.message);
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 200 }),
      content: t.String({ minLength: 1 }),
      excerpt: t.Optional(t.String()),
      authorId: t.Integer({ minimum: 1 }),
      tags: t.Optional(t.Array(t.String()))
    }),
    detail: {
      tags: ['Post'],
      summary: '创建文章'
    }
  })
  
  // ==================== 更新文章 ====================
  .put('/:id', async ({ params, body }) => {
    try {
      const post = await postService.updatePost(params.id, body);
      return successResponse(post, '文章更新成功');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('文章不存在', 'POST_NOT_FOUND');
      }
      return errorResponse('更新失败', error.message);
    }
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
      content: t.Optional(t.String({ minLength: 1 })),
      excerpt: t.Optional(t.String()),
      isPublished: t.Optional(t.Boolean()),
      tags: t.Optional(t.Array(t.String()))
    }),
    detail: {
      tags: ['Post'],
      summary: '更新文章'
    }
  })
  
  // ==================== 删除文章 ====================
  .delete('/:id', async ({ params }) => {
    try {
      await postService.deletePost(params.id);
      return successResponse(null, '文章已删除');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('文章不存在', 'POST_NOT_FOUND');
      }
      return errorResponse('删除失败', error.message);
    }
  }, {
    params: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    detail: {
      tags: ['Post'],
      summary: '删除文章'
    }
  });
```

---

## 8. 最佳实践

### 8.1 数据库连接池配置

创建 `src/utils/prisma.ts`（增强版）：

```typescript
import { PrismaClient } from '@prisma/client';

const prismaOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
};

// 单例模式
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭
async function gracefulShutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### 8.2 错误处理中间件

创建 `src/middleware/error.handler.ts`：

```typescript
import { Elysia } from 'elysia';
import { Prisma } from '@prisma/client';

export const errorHandler = new Elysia()
  .onError(({ code, error, set }) => {
    // Prisma 错误处理
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const errorMap: Record<string, any> = {
        P2000: { status: 400, message: '字段值太长', code: 'FIELD_TOO_LONG' },
        P2002: { status: 409, message: '唯一约束冲突', code: 'UNIQUE_CONSTRAINT' },
        P2003: { status: 400, message: '外键约束失败', code: 'FOREIGN_KEY_ERROR' },
        P2025: { status: 404, message: '记录不存在', code: 'NOT_FOUND' },
        P2029: { status: 400, message: '查询参数错误', code: 'QUERY_ERROR' },
      };
      
      const errorInfo = errorMap[error.code] || {
        status: 500,
        message: '数据库错误',
        code: 'DATABASE_ERROR'
      };
      
      set.status = errorInfo.status;
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.code
      };
    }
    
    // 通用错误处理
    set.status = 500;
    return {
      success: false,
      message: error.message || '内部服务器错误'
    };
  });
```

### 8.3 请求验证中间件

创建 `src/middleware/validation.ts`：

```typescript
import { Elysia, t } from 'elysia';

export const validationMiddleware = new Elysia()
  // 验证用户 ID 参数
  .model({
    userId: t.Object({
      id: t.Integer({ minimum: 1 })
    }),
    pagination: t.Object({
      page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100, default: 10 }))
    })
  });
```

### 8.4 环境变量配置

创建 `.env.example`：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/elysia_demo?schema=public"

# 服务器配置
NODE_ENV="development"
PORT="3000"
HOST="localhost"

# JWT 配置（如需认证）
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# 日志配置
LOG_LEVEL="debug"
```

### 8.5 Docker 部署配置

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: elysia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: elysia_demo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: elysia-app
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/elysia_demo?schema=public
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "bun x prisma migrate deploy &&
             bun run start"

volumes:
  postgres_data:
```

创建 `Dockerfile`：

```dockerfile
FROM oven/bun:1

WORKDIR /app

# 安装依赖
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN bun x prisma generate

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["bun", "run", "start"]
```

---

## 9. 常见问题

### Q1: Cannot connect to database

**问题**: 无法连接数据库

**解决方案**:

```bash
# 1. 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 2. 检查连接字符串
echo $DATABASE_URL

# 3. 测试连接
psql $DATABASE_URL

# 4. 如果使用 Docker，确保容器网络正常
docker network ls
```

### Q2: Prisma Client not found

**问题**: 找不到 Prisma Client

**解决方案**:

```bash
# 重新生成 Prisma Client
bun x prisma generate

# 或者
bun run db:generate
```

### Q3: Migration fails

**问题**: 迁移失败

**解决方案**:

```bash
# 1. 查看migration 状态
bun x prisma migrate status

# 2. 重置数据库（开发环境）
bun x prisma migrate reset

# 3. 如果生产环境，手动修复 SQL
bun x prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

### Q4: Type errors with Prisma

**问题**: TypeScript 类型错误

**解决方案**:

```bash
# 1. 重新生成类型
bun x prisma generate

# 2. 重启 TypeScript 服务
# VS Code: Cmd+Shift+P -> TypeScript: Restart TS Server

# 3. 检查 tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Q5: Slow queries in production

**问题**: 生产环境查询慢

**解决方案**:

```typescript
// 1. 启用查询日志
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

// 2. 添加数据库索引
// prisma/schema.prisma
model User {
  id    Int    @id
  email String @unique
  @@index([email])
}

// 3. 使用 select 限制返回字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true
  }
});
```

### Q6: Connection pool exhausted

**问题**: 连接池耗尽

**解决方案**:

```typescript
// 1. 配置连接池大小
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // 连接池配置
      connectionLimit: 10,
    },
  },
});

// 2. 确保及时断开连接
app.stop(() => {
  prisma.$disconnect();
});

// 3. 使用事务时注意不要长时间持有连接
await prisma.$transaction(async (tx) => {
  // 快速完成事务操作
}, {
  timeout: 10000, // 10 秒超时
});
```

---

## 📚 参考资源

### 官方文档

- [Elysia 官方文档](https://elysiajs.com/)
- [Prisma 官方文档](https://prisma.io/docs)
- [PostgreSQL 官方文档](https://postgresql.org/docs)

### 示例代码

- [完整项目 GitHub](https://github.com/hfcypm/bun-elysia-learn)
- [Elysia + Prisma 示例](../../examples/postgres-prisma/)

### 社区资源

- [Elysia Discord](https://discord.gg/elysia)
- [Prisma Slack](https://slack.prisma.io/)

---

**Happy Coding! 🚀**

---

*最后更新：2026-06-03*
