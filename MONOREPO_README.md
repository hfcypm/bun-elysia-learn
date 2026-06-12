# 📦 Bun Monorepo - 文件上传应用

基于 Bun 的 Monorepo 项目，前后端分离架构。

## 🌳 项目结构

```
.
├── apps/                    # 应用程序
│   ├── backend/            # 后端服务 (Elysia + Bun)
│   │   ├── src/
│   │   │   └── index.ts    # 主入口（文件上传服务）
│   │   ├── package.json
│   │   └── README.md
│   └── frontend/           # 前端应用 (React + Vite + Tailwind)
│       ├── src/
│       │   ├── App.tsx     # 主组件
│       │   ├── main.tsx    # 入口文件
│       │   └── index.css   # 样式
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── packages/               # 共享包（预留）
├── uploads/                # 上传文件存储目录
├── examples/               # 示例和测试文件
├── docs/                   # 项目文档
├── package.json            # 根 package.json（工作区配置）
└── tsconfig.json           # TypeScript 配置
```

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
# 安装所有依赖（包括所有 workspace）
bun install
```

### 2️⃣ 开发模式

```bash
# 同时启动前后端（推荐）
bun run dev

# 只启动后端
bun run dev:backend

# 只启动前端
bun run dev:frontend
```

**访问地址**:
- 前端：http://localhost:3000
- 后端 API：http://localhost:3001
- Swagger 文档：http://localhost:3001/swagger

### 3️⃣ 构建

```bash
# 构建所有
bun run build

# 只构建后端
bun run build:backend

# 只构建前端
bun run build:frontend
```

### 4️⃣ 生产环境

```bash
# 构建后启动后端
bun run start

# 预览前端构建
bun run preview
```

## 📋 工作区

### Backend (apps/backend)

**技术栈**:
- Bun 运行时
- Elysia 框架
- @elysiajs/* 插件

**端口**: 3001

**主要功能**:
- ✅ 单文件上传
- ✅ 批量上传（最多 10 个）
- ✅ 文件列表查询
- ✅ 文件详情
- ✅ 删除功能
- ✅ 静态文件服务
- ✅ 统计信息

**常用命令**:
```bash
cd apps/backend
bun run dev      # 开发模式
bun run start    # 生产模式
bun run build    # 构建
```

### Frontend (apps/frontend)

**技术栈**:
- React 18
- Vite 5
- Tailwind CSS 3
- TypeScript 5

**端口**: 3000

**功能**:
- ✅ 单文件上传界面
- ✅ 批量上传界面
- ✅ 实时预览
- ✅ 文件列表展示
- ✅ 删除操作
- ✅ 响应式设计

**常用命令**:
```bash
cd apps/frontend
bun run dev       # 开发模式
bun run build     # 构建
bun run preview   # 预览构建结果
```

## 🔌 API 代理配置

前端通过 Vite 代理访问后端 API:

```ts
// apps/frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/static': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

**前端调用示例**:
```ts
// 直接调用 /api 路径，会自动代理到后端
fetch('/api/upload', {
  method: 'POST',
  body: formData
})
```

## 🔧 开发工具

### TypeScript

```bash
# 类型检查
bun run typecheck
```

### 代码检查

```bash
# Lint
bun run lint
```

### 清理

```bash
# 清理构建产物
bun run clean
```

## 📊 架构图

```
┌─────────────────┐         ┌─────────────────┐
│   用户浏览器     │         │   Bun 运行时    │
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │  React    │  │         │  │  Elysia   │  │
│  │  Vite     │──┼─────┐   │  │  Server   │  │
│  │  Tailwind │  │     │   │  │           │  │
│  └───────────┘  │     │   │  └────┬──────┘  │
│   Port: 3000    │     │   │   Port: 3001    │
└─────────────────┘     │   └────────┬────────┘
                        │            │
                        │            ▼
                        │   ┌────────────────┐
                        │   │   /uploads/    │
                        │   │  (文件系统)    │
                        │   └────────────────┘
                        │
                        └─────────────────────┘
```

## 📝 相关文档

- [后端 API 文档](apps/backend/README.md)
- [文件上传指南](docs/07-file_upload_guide.md)
- [使用示例](examples/README-FILE-UPLOAD.md)

## 🎯 下一步

- [ ] 添加共享 UI 组件库 (packages/ui)
- [ ] 添加共享工具函数 (packages/utils)
- [ ] 集成 Prisma ORM
- [ ] 添加 Docker 支持
- [ ] CI/CD 配置

## 💡 提示

1. **端口占用**: 确保 3000 和 3001 端口未被占用
2. **文件存储**: 上传的文件保存在根目录 `uploads/`
3. **跨域问题**: 开发环境已配置代理，生产环境需配置 CORS
4. **热重载**: 后端使用 `--watch` 模式，支持热重载

---

**最后更新**: 2026-06-12  
**作者**: AI Assistant
