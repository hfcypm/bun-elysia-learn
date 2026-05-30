# Elysia.js 循序渐进学习项目 🦊

通过实际案例，从零开始掌握 Elysia.js RESTful API 开发。

## 🎯 项目特点

- ✅ **循序渐进**: 从基础到高级，6 个精心设计的案例
- ✅ **实战导向**: 每个案例都是真实业务场景
- ✅ **完整代码**: 所有代码示例都可直接运行
- ✅ **中文文档**: 详细的中文学习指南和练习手册
- ✅ **最佳实践**: 遵循 Elysia 官方推荐模式

## 📋  prerequisites

### 环境要求

- Node.js 18+ 或 Bun 运行时
- npm / yarn / pnpm / bun

### 安装 Bun (推荐)

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "iwr https://bun.sh/install.ps1 -useb | iex"
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd elysia-learning
npm install
# 或使用 bun
bun install
```

### 2. 运行案例

每个案例独立运行，从基础开始：

```bash
# ===== Level 1: 基础入门 =====
# 案例 1: Hello Elysia
npm run dev:basic

# 案例 2: HTTP 方法与 CRUD
npm run dev:example1

# ===== Level 2: 进阶技能 =====
# 案例 3: 请求验证
npm run dev:example2

# 案例 4: 中间件系统
npm run dev:example3

# 案例 5: 图片上传服务 (批量上传)
npm run dev:example4

# ===== Level 3: 实战项目 =====
# 案例 6: 博客文章管理系统
npm run dev:example5

# 案例 7: JWT 认证系统
npm run dev:example6

# 案例 8: WebSocket 聊天室
npm run dev:example7
```

## 📚 学习路径

### Level 1: 基础入门 (1-2 小时)

| 案例 | 文件 | 知识点 |
|------|------|--------|
| 1. Hello Elysia | `src/basic/01-hello.ts` | 创建应用、基础路由、参数处理 |
| 2. HTTP 方法与 CRUD | `src/basic/02-http-methods.ts` | RESTful API、状态码、完整 CRUD |

**学习重点**:
- 理解 Elysia 的基本用法
- 掌握 RESTful API 设计规范
- 熟悉 HTTP 方法和状态码

---

### Level 2: 进阶技能 (2-3 小时)

| 案例 | 文件 | 知识点 |
|------|------|--------|
| 3. 请求验证 | `src/intermediate/03-validation.ts` | TypeBox 验证、错误处理 |
| 4. 中间件系统 | `src/intermediate/04-middleware.ts` | 认证中间件、CORS、日志 |
| 5. 图片上传 | `src/intermediate/05-file-upload.ts` | 单文件上传、批量上传、文件验证 |

**学习重点**:
- 掌握请求验证技术
- 理解中间件的工作原理
- 实现认证和授权

---

### Level 3: 实战项目 (4-6 小时)

| 案例 | 文件 | 知识点 |
|------|------|--------|
| 6. 博客 API | `src/advanced/05-blog-api.ts` | 复杂数据模型、分页、关联查询 |
| 7. 认证系统 | `src/advanced/06-auth.ts` | JWT、密码加密、权限控制 |
| 8. WebSocket | `src/advanced/07-websocket.ts` | 实时通信、消息广播 |

**学习重点**:
- 构建完整的业务系统
- 处理复杂的数据关系
- 实现安全的认证系统

---

## 📖 文档

**推荐阅读顺序**:

1. **[📌 开始学习](docs/00-README.md)** - 文档导航总入口
2. **[01 安装指南](docs/01-INSTALLATION.md)** - 环境配置
3. **[02 学习方案总结](docs/02-STUDY_PLAN_SUMMARY.md)** - 6 周计划概览
4. **[03 学习方案 Part1](docs/03-STUDY_PLAN_PART1.md)** - 第 1-3 周详细计划
5. **[04 学习方案 Part2](docs/04-STUDY_PLAN_PART2.md)** - 第 4-6 周详细计划
6. **[05 学习路线图](docs/05-LEARNING_PATH.md)** - 可视化学习路径
7. **[06 练习手册](docs/06-PRACTICE.md)** - 实战练习题
8. **[07 文件上传指南](docs/07-FILE_UPLOAD_GUIDE.md)** - 图片上传实战
9. **[08 快速参考](docs/08-QUICK_REFERENCE.md)** - API 速查卡片

## 🔍 API 测试

### 使用 curl

```bash
# Hello Elysia
curl http://localhost:3000/

# 获取用户列表 (案例 2)
curl http://localhost:3001/todos

# 创建待办事项
curl -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "学习 Elysia"}'
```

### 使用 HTTPie (推荐)

```bash
# 安装 HTTPie
npm install -g httpie

# 测试 GET 请求
http GET http://localhost:3001/todos

# 测试 POST 请求
http POST http://localhost:3001/todos title="学习 Elysia"
```

### 使用 Postman / Insomnia

导入以下集合测试所有接口:
- [Postman Collection](docs/elysia-learning.postman_collection.json) (待生成)
- [Insomnia Workspace](docs/elysia-learning.insomnia_workspace.json) (待生成)

## 🛠️ 技术栈

- **运行时**: [Bun](https://bun.sh/) (或 Node.js)
- **框架**: [Elysia.js](https://elysiajs.com/)
- **验证**: [TypeBox](https://github.com/sinclairzx81/typebox)
- **认证**: [@elysiajs/jwt](https://github.com/elysiajs/elysia)
- **CORS**: [@elysiajs/cors](https://github.com/elysiajs/elysia)

## 📁 项目结构

```
elysia-learning/
├── src/
│   ├── basic/              # Level 1 基础案例
│   │   ├── 01-hello.ts
│   │   └── 02-http-methods.ts
│   ├── intermediate/       # Level 2 进阶案例
│   │   ├── 03-validation.ts
│   │   └── 04-middleware.ts
│   ├── advanced/           # Level 3 实战案例
│   │   ├── 05-blog-api.ts
│   │   └── 06-auth.ts
│   └── practice/           # 练习答案 (待完成)
├── docs/
│   ├── README.md           # 学习指南
│   └── PRACTICE.md         # 练习手册
├── package.json
├── tsconfig.json
└── README.md
```

## 🎓 学习成果

完成本教程后，你将能够:

- ✅ 独立开发 RESTful API
- ✅ 实现用户认证和授权
- ✅ 处理复杂的数据验证
- ✅ 编写可复用的中间件
- ✅ 构建完整的业务系统
- ✅ 调试和测试 API

## 💡 最佳实践

### 1. 代码组织

```typescript
// ✅ 推荐：清晰的路由分组
app.group('/api/v1/users', app => app
  .get('/', listUsers)
  .post('/', createUser)
  .get('/:id', getUser)
  .put('/:id', updateUser)
  .delete('/:id', deleteUser)
)

// ❌ 避免：路由分散
app.get('/api/v1/users', listUsers)
app.post('/api/v1/users', createUser)
// ...
```

### 2. 错误处理

```typescript
// ✅ 推荐：统一错误格式
app.onError(({ code, error }) => {
  if (code === 'VALIDATION') {
    return {
      success: false,
      message: '验证失败',
      errors: error.errors
    }
  }
  return {
    success: false,
    message: '服务器错误'
  }
})
```

### 3. 类型安全

```typescript
// ✅ 推荐：定义完整的数据类型
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

.get('/users/:id', ({ params }): ApiResponse<User> => {
  return {
    success: true,
    data: user
  }
})
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License

## 🔗 相关资源

- [Elysia 官方文档](https://elysiajs.com/)
- [Elysia 中文文档](https://elysia.zhcndoc.com/)
- [Bun 官方文档](https://bun.sh/docs)
- [TypeBox 文档](https://github.com/sinclairzx81/typebox)
- [RESTful API 设计最佳实践](https://restfulapi.net/)

## 📬 问题反馈

如有问题，请提交到 GitHub Issues 或联系作者。

Happy Coding! 🚀
