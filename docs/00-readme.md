# Elysia.js 循序渐进学习指南

本教程通过实际案例，帮助你从零开始掌握 Elysia.js 框架。

## 📚 目录结构

```
elysia-learning/
├── src/
│   ├── basic/           # Level 1: 基础入门
│   │   ├── 01-hello.ts         # 第一个 Elysia 应用
│   │   └── 02-http-methods.ts  # HTTP 方法与 CRUD
│   ├── intermediate/    # Level 2: 进阶技能
│   │   ├── 03-validation.ts    # 请求验证
│   │   ├── 04-middleware.ts    # 中间件系统
│   │   └── 05-file-upload.ts   # 图片上传服务（批量上传）
│   └── advanced/        # Level 3: 实战项目
│       ├── 05-blog-api.ts      # 博客文章管理系统
│       ├── 06-auth.ts          # JWT 认证系统
│       └── 07-websocket.ts     # WebSocket 实时聊天室
├── docs/                # 学习文档
├── package.json
└── tsconfig.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd elysia-learning
npm install
```

### 2. 运行案例

每个案例都配置了独立的启动命令：

```bash
# Level 1: 基础入门
npm run dev:basic         # 案例 1: Hello Elysia
npm run dev:example1      # 案例 2: HTTP 方法与 CRUD

# Level 2: 进阶技能
npm run dev:example2      # 案例 3: 请求验证
npm run dev:example3      # 案例 4: 中间件系统

# Level 3: 实战项目
npm run dev:example4      # 案例 5: 博客 API
npm run dev:example5      # 案例 6: JWT 认证
```

## 📖 学习路径

### Level 1: 基础入门 (预计 1-2 小时)

#### 案例 1: Hello Elysia
- ✅ 创建 Elysia 应用
- ✅ 基础路由定义
- ✅ 路径参数和查询参数

**练习任务：**
- [ ] 修改欢迎消息
- [ ] 添加一个新的路由 `/greet/:name` 返回个性化问候
- [ ] 尝试使用查询参数过滤数据

#### 案例 2: HTTP 方法与 CRUD
- ✅ GET/POST/PUT/PATCH/DELETE
- ✅ 状态码设置
- ✅ RESTful API 设计规范

**练习任务：**
- [ ] 添加"标记所有为完成"的接口
- [ ] 实现按完成状态筛选
- [ ] 添加批量删除功能

---

### Level 2: 进阶技能 (预计 2-3 小时)

#### 案例 3: 请求验证
- ✅ TypeBox 验证库
- ✅ 请求体、查询参数、路径参数验证
- ✅ 自定义错误处理

**练习任务：**
- [ ] 添加更多验证规则（正则、自定义验证）
- [ ] 实现嵌套对象验证
- [ ] 创建统一的错误响应格式

#### 案例 4: 中间件系统
- ✅ 请求日志
- ✅ CORS 跨域
- ✅ 认证中间件
- ✅ 路由组

**练习任务：**
- [ ] 添加请求限流中间件
- [ ] 实现 IP 白名单
- [ ] 添加响应时间统计

---

### Level 3: 实战项目 (预计 4-6 小时)

#### 案例 5: 博客文章管理系统
- ✅ 完整 CRUD
- ✅ 关联数据模型
- ✅ 分页查询
- ✅ 数据筛选

**练习任务：**
- [ ] 添加文章搜索功能
- [ ] 实现标签云统计
- [ ] 添加文章点赞功能
- [ ] 实现评论回复功能

#### 案例 6: JWT 认证系统
- ✅ Token 生成和验证
- ✅ 用户注册和登录
- ✅ 密码加密
- ✅ 刷新 Token
- ✅ 权限控制

**练习任务：**
- [ ] 添加邮箱验证
- [ ] 实现记住我功能
- [ ] 添加账号封禁功能
- [ ] 实现 OAuth2 登录（Google、GitHub）

---

## 🔧 常用命令参考

### 启动开发服务器

```bash
# 使用 tsx 的热重载功能
npx tsx watch src/basic/01-hello.ts
```

### 测试 API

```bash
# 使用 curl 测试
curl http://localhost:3000/

# 使用 HTTPie (推荐)
http GET http://localhost:3000/users

# 使用 Postman 或 Insomnia
```

### 代码生成

可以使用 Trae 或其他 AI 工具生成代码：

```
提示词示例：用 Elysia 创建一个图书管理 API，包含借书、还书、逾期计算功能
```

---

## 📝 最佳实践

### 1. 项目结构

```
src/
├── controllers/   # 控制器
├── models/        # 数据模型
├── middlewares/   # 中间件
├── routes/        # 路由定义
├── utils/         # 工具函数
└── index.ts       # 入口文件
```

### 2. 环境变量

```typescript
// config.ts
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET!,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432')
  }
}
```

### 3. 错误处理

```typescript
app.onError(({ code, error }) => {
  console.error('Error:', error)
  
  if (code === 'VALIDATION') {
    return {
      success: false,
      message: '验证失败',
      errors: error.errors
    }
  }
  
  return {
    success: false,
    message: '服务器错误',
    code: 'INTERNAL_ERROR'
  }
})
```

### 4. 类型定义

```typescript
// types.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: number
}

export type UserRole = 'user' | 'admin' | 'moderator'
```

---

## 🎯 学习检查清单

完成学习后，你应该能够：

- [ ] 创建 Elysia 应用并配置路由
- [ ] 使用不同的 HTTP 方法处理请求
- [ ] 使用 TypeBox 进行请求验证
- [ ] 编写自定义中间件
- [ ] 实现 JWT 认证系统
- [ ] 设计 RESTful API
- [ ] 处理错误和异常
- [ ] 实现数据持久化（连接真实数据库）
- [ ] 部署 Elysia 应用到生产环境

---

## 📚 扩展阅读

- **官方文档**: https://elysiajs.com
- **中文文档**: https://elysia.zhcndoc.com
- **GitHub**: https://github.com/elysiajs/elysia
- **Discord**: https://discord.gg/elysia

## 📋 推荐学习方案

我们为你准备了详细的 **6 周系统学习方案**，包含每天的学习内容、时间分配和实践任务：

- **[03-STUDY_PLAN_PART1.md](03-STUDY_PLAN_PART1.md)**: 第 1-3 周（基础入门到实战项目）
- **[04-STUDY_PLAN_PART2.md](04-STUDY_PLAN_PART2.md)**: 第 4-6 周（项目实战到部署运维）

建议按照学习方案循序渐进，不要跳步学习。

---

## 🚀 下一步

完成本教程后，你可以：

1. 构建自己的完整项目
2. 学习数据库集成（PostgreSQL、MongoDB）
3. 探索 Elysia 插件生态
4. 学习微服务架构
5. 部署到云平台
