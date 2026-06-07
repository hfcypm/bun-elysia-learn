# Elysia.js 循序渐进学习项目 🦊

> 从入门到生产实践的完整学习路径  
> **项目完整度**: 95%+ | **总代码**: 60+ 文件 | **文档**: 20+ 篇

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Powered%20by-Bun-fbfbfb)](https://bun.sh/)
[![Elysia.js](https://img.shields.io/badge/Elysia.js-v1.1-red)](https://elysiajs.com/)

---

## 🎯 项目特点

| 特点 | 说明 |
|------|------|
| 📚 **循序渐进** | 从基础到高级，3 个阶段 70+ 个案例 |
| 💼 **实战导向** | 博客/电商/书签等真实业务场景 |
| ✅ **完整代码** | 所有示例都可一键运行 |
| 🇨🇳 **中文文档** | 20+ 篇详细教程和指南 |
| 🚀 **生产就绪** | Docker/测试/安全/性能优化全覆盖 |
| 🧪 **测试完善** | Bun 测试 + 集成测试 + Mock 示例 |

---

## 📋 环境准备

### 推荐运行时

```bash
# 安装 Bun (推荐，性能提升 4 倍)
curl -fsSL https://bun.sh/install | bash

# 或使用 Node.js (18+)
# https://nodejs.org/
```

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/hfcypm/bun-elysia-learn
cd bun-elysia-learn

# 2. 安装依赖
bun install

# 3. 运行测试
bun test

# 4. 启动应用
bun run src/basic/01-hello.ts
```

---

## 📚 学习内容导航

### 🟢 阶段一：基础入门 (3-5 小时)

| 案例 | 文件 | 知识点 | 难度 |
|------|------|--------|------|
| Hello Elysia | `src/basic/01-hello.ts` | 创建应用、基础路由 | ⭐ |
| HTTP CRUD | `src/basic/02-http-methods.ts` | RESTful API、完整 CRUD | ⭐ |
| 环境配置 | `src/basic/03-env-config.ts` | 环境变量、配置管理 | ⭐⭐ |

**学习重点**:
- 理解 Elysia 基本用法
- 掌握 RESTful API 设计
- 熟悉 HTTP 方法和状态码

---

### 🟡 阶段二：进阶技能 (5-8 小时)

| 案例 | 文件 | 知识点 | 难度 |
|------|------|--------|------|
| 请求验证 | `src/intermediate/03-validation.ts` | TypeBox 验证 | ⭐⭐ |
| 中间件 | `src/intermediate/04-middleware.ts` | 认证/CORS/日志 | ⭐⭐⭐ |
| 文件上传 | `src/intermediate/05-file-upload.ts` | 单文件/多文件上传 | ⭐⭐⭐ |
| SQLite 数据库 | `src/intermediate/06-database-sqlite.ts` | SQLite CRUD | ⭐⭐⭐ |
| PostgreSQL | `src/intermediate/07-database-postgres.ts` | PostgreSQL集成 | ⭐⭐⭐ |
| 日志系统 | `src/intermediate/08-logging.ts` | 结构化日志 | ⭐⭐ |
| Prisma ORM | `src/intermediate/08-prisma-orm.ts` | Prisma 完整教程 | ⭐⭐⭐ |

**学习重点**:
- 请求验证和错误处理
- 中间件开发
- 数据库操作
- 文件上传

---

### 🔴 阶段三：实战项目 (10-15 小时)

| 案例 | 文件 | 知识点 | 难度 |
|------|------|--------|------|
| 博客系统 | `src/advanced/05-blog-api.ts` | 复杂数据模型、分页 | ⭐⭐⭐⭐ |
| JWT 认证 | `src/advanced/06-auth.ts` | JWT、密码加密 | ⭐⭐⭐⭐ |
| WebSocket | `src/advanced/07-websocket.ts` | 实时通信 | ⭐⭐⭐⭐ |
| API 版本控制 | `src/advanced/08-api-versioning.ts` | API 版本管理 | ⭐⭐⭐ |
| **书签系统** | `src/advanced/bookmark-system.ts` | **综合实战 (1500 行)** | ⭐⭐⭐⭐⭐ |

**学习重点**:
- 完整业务系统开发
- 用户认证授权
- 实时通信
- 综合实战

---

### 🧪 专题补充

#### 测试专题 ✅

| 文件 | 内容 | 行数 |
|------|------|------|
| `src/testing/01-bun-test-basics.test.ts` | Bun 测试基础 | 200+ |
| `src/testing/02-elysia-test-utils.test.ts` | Elysia 测试工具 | 250+ |
| `src/testing/03-unit-test-example.test.ts` | 单元测试示例 | 350+ |
| `src/testing/04-mock-example.test.ts` | Mock 数据示例 | 300+ |
| `src/testing/05-integration-test-example.test.ts` | 集成测试示例 | 300+ |

#### 部署专题 ✅

| 文件 | 内容 | 说明 |
|------|------|------|
| `src/deployment/Dockerfile` | Docker 配置 | 多阶段构建 |
| `src/deployment/docker-compose.yml` | Docker Compose | 服务编排 |
| `src/deployment/03-health-check.ts` | 健康检查 | K8s 兼容 |
| `src/deployment/04-graceful-shutdown.ts` | 优雅关闭 | 资源清理 |
| `src/deployment/pm2.config.js` | PM2 配置 | 集群模式 |

#### 安全专题 ✅

- `src/security/01-helmet-security.ts` - Helmet 安全响应头

### CORS 跨域专题 ⭐ 新增

| 文件 | 说明 | 内容 |
|------|------|------|
| `examples/03-middleware/cors.ts` | **CORS 完整示例** | 340+ 行，生产级配置 |
| `examples/03-middleware/cors-test-frontend.html` | **前端测试页面** | 图形化测试工具 |
| `docs/CORS_GUIDE.md` | **CORS 完全指南** | 700+ 行，从入门到实战 |

---

## 📖 完整文档体系

### 学习指南

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| [docs/00-README.md](docs/00-README.md) | 📖 学习指南 | 10 分钟 |
| [docs/01-INSTALLATION.md](docs/01-INSTALLATION.md) | 🔧 安装环境 | 15 分钟 |
| [docs/02-STUDY_PLAN_SUMMARY.md](docs/02-STUDY_PLAN_SUMMARY.md) | 📋 6 周方案 | 20 分钟 |
| [docs/03-STUDY_PLAN_PART1.md](docs/03-STUDY_PLAN_PART1.md) | 📅 第 1-3 周 | 30 分钟 |
| [docs/04-STUDY_PLAN_PART2.md](docs/04-STUDY_PLAN_PART2.md) | 📅 第 4-6 周 | 30 分钟 |
| [docs/05-LEARNING_PATH.md](docs/05-LEARNING_PATH.md) | 🗺️ 学习路线 | 15 分钟 |
| [docs/06-PRACTICE.md](docs/06-PRACTICE.md) | 💻 练习手册 | 按需 |
| [docs/07-FILE_UPLOAD_GUIDE.md](docs/07-FILE_UPLOAD_GUIDE.md) | 📤 文件上传 | 30 分钟 |
| [docs/08-QUICK_REFERENCE.md](docs/08-QUICK_REFERENCE.md) | 🚀 快速参考 | 查阅 |

### 进阶文档 ⭐ 新增

| 文档 | 说明 | 页数 |
|------|------|------|
| [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md) | **完整部署指南** | 698 行 |
| [docs/TESTING.md](docs/TESTING.md) | **测试指南** | 673 行 |
| [docs/SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md) | **安全指南** | 618 行 |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | **性能优化** | 497 行 |
| [docs/FAQ.md](docs/FAQ.md) | **常见问题** | 402 行 |

### Prisma 专题 ⭐ 新增

| 文档 | 说明 | 内容 |
|------|------|------|
| [docs/PRISMA_TUTORIAL.md](docs/PRISMA_TUTORIAL.md) | Prisma 完整教程 | 12 章 |
| [docs/PRISMA_LEARNING_PATH.md](docs/PRISMA_LEARNING_PATH.md) | 学习路径 | 7 天计划 |
| [docs/PRISMA_GUIDE.md](docs/PRISMA_GUIDE.md) | Prisma 使用指南 | 参考手册 |
| [docs/BOOKMARK_SYSTEM_GUIDE.md](docs/BOOKMARK_SYSTEM_GUIDE.md) | 书签系统文档 | API 文档 |

### Prisma 示例 ⭐ 新增

| 示例 | 说明 | 行数 |
|------|------|------|
| `examples/prisma-basic-user.ts` | 用户管理 CRUD | 200+ |
| `examples/prisma-blog.ts` | 博客系统关系 | 400+ |
| `examples/prisma-ecommerce.ts` | 电商系统事务 | 350+ |

### 示例片段 (examples/)

```
examples/
├── 01-router/           # 路由示例 (4 个文件)
├── 02-validation/       # 验证示例 (5 个文件)
├── 03-middleware/       # 中间件示例 (4 个文件)
├── 04-response/         # 响应示例 (4 个文件)
├── 05-plugins/          # 插件示例 (4 个文件)
├── 06-hooks/            # Hooks 示例 (2 个文件)
└── 07-error-handling/   # 错误处理 (1 个文件)
```

---

## 🚀 常用命令

### 开发命令

```bash
# 基础案例
bun run dev:basic        # Hello Elysia
bun run dev:example1     # HTTP CRUD

# 进阶案例
bun run dev:example2     # 请求验证
bun run dev:example3     # 中间件
bun run dev:example4     # 文件上传

# 高级案例
bun run dev:example5     # 博客 API
bun run dev:example6     # JWT 认证
bun run dev:example7     # WebSocket
bun run dev:bookmark     # 书签系统 (综合)
```

### 测试命令 ⭐ 新增

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test src/testing/01-bun-test-basics.test.ts

# 监视模式
bun test --watch

# 生成覆盖率报告
bun test --coverage
```

### 部署命令 ⭐ 新增

```bash
# Docker
npm run docker:build     # 构建镜像
npm run docker:run       # 运行容器
npm run docker:compose   # Docker Compose 启动

# PM2
npm run pm2:start        # 启动应用
npm run pm2:stop         # 停止应用
npm run pm2:logs         # 查看日志

# CORS 测试 ⭐ 新增
bun run examples/03-middleware/cors.ts  # 启动 CORS 后端
# 浏览器打开：examples/03-middleware/cors-test-frontend.html
```

---

## 📁 项目结构

```
bun-elysia-learn/
├── 📚 docs/                      # 文档目录 (20+ 篇)
│   ├── 00-README.md             # 学习指南
│   ├── 01-INSTALLATION.md       # 安装指南
│   ├── 02-STUDY_PLAN_SUMMARY.md # 6 周方案
│   ├── 03-STUDY_PLAN_PART1.md   # 第 1-3 周
│   ├── 04-STUDY_PLAN_PART2.md   # 第 4-6 周
│   ├── 05-LEARNING_PATH.md      # 学习路线
│   ├── 06-PRACTICE.md           # 练习手册
│   ├── 07-FILE_UPLOAD_GUIDE.md  # 文件上传
│   ├── 08-QUICK_REFERENCE.md    # 快速参考
│   ├── TESTING.md               # 测试指南 ⭐
│   ├── SECURITY_GUIDE.md        # 安全指南 ⭐
│   ├── PERFORMANCE.md           # 性能优化 ⭐
│   ├── FAQ.md                   # 常见问题 ⭐
│   ├── PRISMA_TUTORIAL.md       # Prisma 教程 ⭐
│   ├── PRISMA_LEARNING_PATH.md  # Prisma 路径 ⭐
│   └── BOOKMARK_SYSTEM_GUIDE.md # 书签系统 ⭐
│
├── 🏗️ deployment/                # 部署资源 ⭐
│   ├── Dockerfile               # Docker 配置
│   ├── docker-compose.yml       # Compose 编排
│   ├── 03-health-check.ts       # 健康检查
│   ├── 04-graceful-shutdown.ts  # 优雅关闭
│   └── pm2.config.js            # PM2 配置
│
├── 📝 src/                       # 源代码目录
│   ├── basic/                   # 基础案例 (3 个)
│   ├── intermediate/            # 进阶案例 (7 个)
│   ├── advanced/                # 高级案例 (5 个)
│   ├── practice/                # 练习案例 (7 个)
│   ├── testing/                 # 测试专题 ⭐ (5 个)
│   ├── deployment/              # 部署专题 ⭐ (5 个)
│   └── security/                # 安全专题 ⭐ (1 个)
│
  ├── 📦 examples/                  # 示例片段 (25+ 个)
  │   ├── 01-router/               # 路由示例
  │   ├── 02-validation/           # 验证示例
  │   ├── 03-middleware/           # 中间件示例 ⭐
  │   │   ├── cors.ts              # CORS 完整示例 (340+ 行)
  │   │   └── cors-test-frontend.html # 前端测试页面
  │   ├── 04-response/             # 响应示例
  │   ├── 05-plugins/              # 插件示例
  │   ├── 06-hooks/                # Hooks 示例
  │   ├── 07-error-handling/       # 错误处理
  │   └── prisma-*.ts              # Prisma 示例 ⭐
│
├── 🔧 deployment/                # 部署配置 ⭐
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pm2.config.js
│
├── 📊 报告与分析
├── ├── FINAL_COMPLETION_REPORT.md  # 最终完成报告
├── ├── COMPLETION_REPORT.md        # 补充报告
└── └── MISSING_CASES_ANALYSIS.md   # 分析报告
│
├── package.json                    # 依赖配置
├── tsconfig.json                   # TypeScript 配置
└── README.md                       # 项目说明
```

---

## 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **运行时** | [Bun](https://bun.sh/) | Latest |
| **框架** | [Elysia.js](https://elysiajs.com/) | v1.1+ |
| **语言** | TypeScript | v5.7+ |
| **验证** | TypeBox | Latest |
| **JWT** | @elysiajs/jwt | v1.1+ |
| **CORS** | @elysiajs/cors | v1.1+ ⭐ |
| **ORM** | Prisma | Latest |
| **数据库** | SQLite / PostgreSQL | - |

---

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
// ✅ 推荐：完整类型定义
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

.get('/users/:id', ({ params }): ApiResponse<User> => {
  return { success: true, data: user }
})
```

---

## 🎓 学习成果

完成本教程后，你将能够：

| 能力 | 掌握程度 |
|------|----------|
| ✅ 独立开发 RESTful API | ⭐⭐⭐⭐⭐ |
| ✅ 实现用户认证和授权 | ⭐⭐⭐⭐⭐ |
| ✅ 处理复杂的数据验证 | ⭐⭐⭐⭐⭐ |
| ✅ 编写可复用的中间件 | ⭐⭐⭐⭐⭐ |
| ✅ 构建完整的业务系统 | ⭐⭐⭐⭐⭐ |
| ✅ 编写测试用例 | ⭐⭐⭐⭐⭐ |
| ✅ Docker 容器化部署 | ⭐⭐⭐⭐⭐ |
| ✅ 性能优化和监控 | ⭐⭐⭐⭐ |
| ✅ 安全加固 | ⭐⭐⭐⭐ |

---

## 📊 项目统计

| 类别 | 数量 | 行数 |
|------|------|------|
| **基础案例** | 3 个 | ~500 |
| **进阶案例** | 7 个 | ~2000 |
| **高级案例** | 5 个 | ~3000 |
| **练习案例** | 7 个 | ~1500 |
| **测试专题** | 5 个 | ~1500 |
| **部署专题** | 5 个 | ~800 |
| **安全专题** | 1 个 | ~100 |
| **CORS 专题** | 2 个 | ~740 |
| **示例片段** | 25+ 个 | ~2500 |
| **文档** | 21+ 篇 | ~9200 |
| **Prisma 示例** | 3 个 | ~950 |
| **总计** | **80+** | **~20390** |

---

## 🔗 相关资源

### 官方文档
- [Elysia 官方文档](https://elysiajs.com/)
- [Elysia 中文文档](https://elysia.zhcndoc.com/)
- [Bun 官方文档](https://bun.sh/docs)
- [Prisma 官方文档](https://prisma.io/docs)

### 社区资源
- [Discord 社区](https://discord.gg/elysia)
- [GitHub Issues](https://github.com/elysiajs/elysia/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/elysia)

### 外部链接
- [TypeBox 文档](https://github.com/sinclairzx81/typebox)
- [RESTful API 设计](https://restfulapi.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

### 如何贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发设置

```bash
# 1. Fork & Clone
git clone https://github.com/hfcypm/bun-elysia-learn

# 2. 安装依赖
bun install

# 3. 运行测试
bun test

# 4. 开始开发
bun run dev:basic
```

---

## 📄 许可证

MIT License

---

## 📬 联系方式

- **作者**: [@hfcypm](https://github.com/hfcypm)
- **项目地址**: https://github.com/hfcypm/bun-elysia-learn
- **问题反馈**: [GitHub Issues](https://github.com/hfcypm/bun-elysia-learn/issues)

---

## 🎉 最近更新

### 2026-06-07 ⭐ CORS 专题更新

**新增内容**:

- ✅ **CORS 完整示例**: `examples/03-middleware/cors.ts` (340+ 行)
  - 开发/生产环境自动识别
  - 动态 Origin 白名单验证
  - 完整 Cookie 认证流程 (登录/受保护接口)
  - exposedHeaders 演示 (分页响应头)
  - 9 个 API 端点示例

- ✅ **前端测试页面**: `examples/03-middleware/cors-test-frontend.html` (450+ 行)
  - 精美图形化界面
  - 4 大测试模块 (基础/认证/高级/信息)
  - 实时响应头检查
  - 一键测试所有 CORS 场景

- ✅ **CORS 完全指南**: `docs/CORS_GUIDE.md` (700+ 行)
  - CORS 概念解析与工作原理
  - Elysia 配置详解 (生产级)
  - 前端调用示例 (React/Vue)
  - 6 个常见错误排查
  - 快速测试清单

**使用方式**:
```bash
# 启动 CORS 后端
bun run examples/03-middleware/cors.ts

# 浏览器打开测试页面
examples/03-middleware/cors-test-frontend.html

# 查看文档
docs/CORS_GUIDE.md
```

**项目完整度**: 95% → **98%+**

---

### 2026-06-03 ⭐ 重大更新

**新增内容**:

- ✅ **测试专题**: 5 个测试文件，1500+ 行代码
- ✅ **部署专题**: 5 个部署文件，800+ 行代码
- ✅ **安全专题**: Helmet 安全响应头
- ✅ **文档体系**: 5 篇进阶文档，2888 行
  - deployment/DEPLOYMENT.md (698 行)
  - docs/TESTING.md (673 行)
  - docs/SECURITY_GUIDE.md (618 行)
  - docs/PERFORMANCE.md (497 行)
  - docs/FAQ.md (402 行)
- ✅ **Prisma 专题**: 3 个示例 + 3 篇文档

**项目完整度**: 75% → **95%+**

详细报告：[FINAL_COMPLETION_REPORT.md](FINAL_COMPLETION_REPORT.md)

### 历史更新

- 2026-05-31: 添加 Prisma 循序渐进学习教程
- 2026-05-30: 添加书签管理系统综合案例
- 2026-05-29: 完善学习计划和文档体系

---

**Happy Coding! 🚀**

---

*最后更新：2026-06-07*
