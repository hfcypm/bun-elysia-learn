# 📦 Bun Monorepo 项目结构

## 🌳 目录结构

```
/workspace
├── apps/                      # 应用程序
│   ├── backend/              # 后端服务
│   │   ├── src/
│   │   │   └── index.ts      # Elysia 文件上传服务
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── frontend/             # 前端应用
│       ├── src/
│       │   ├── App.tsx       # React 主组件
│       │   ├── main.tsx      # 入口文件
│       │   └── index.css     # Tailwind CSS
│       ├── public/
│       │   └── vite.svg
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts    # Vite 配置（含 API 代理）
│       ├── tailwind.config.js
│       └── postcss.config.js
│
├── packages/                  # 共享包（预留扩展）
│
├── uploads/                   # 上传文件存储目录
│
├── examples/                  # 示例和测试文件
│   ├── file-upload-test.tsx   # React 组件（原始版本）
│   ├── file-upload-test.html  # 独立 HTML 测试页面
│   └── README-FILE-UPLOAD.md  # 使用文档
│
├── src/                       # 旧的源代码目录（保留）
├── docs/                      # 项目文档
├── deployment/                # 部署配置
│
├── package.json               # 根 package.json（工作区配置）
├── tsconfig.json              # TypeScript 配置
├── start-monorepo.sh          # 启动脚本
└── MONOREPO_README.md         # Monorepo 说明文档
```

## 🎯 架构说明

### 工作区（Workspaces）

项目使用 Bun 的 workspaces 功能，支持多个子项目共享依赖。

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### 前后端通信

```
┌──────────────┐         ┌──────────────┐
│   Frontend   │         │    Backend   │
│ Port: 3000   │ ──────▶ │ Port: 3001   │
│   (Vite)     │  Proxy  │  (Elysia)    │
└──────────────┘         └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   /uploads   │
                         │ (文件系统)   │
                         └──────────────┘
```

**Vite 代理配置** (`apps/frontend/vite.config.ts`):
```ts
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
}
```

### 开发模式

```bash
# 方式 1: 使用启动脚本（推荐）
./start-monorepo.sh

# 方式 2: 使用 monorepo 命令
bun run dev              # 启动所有
bun run dev:backend      # 只启动后端
bun run dev:frontend     # 只启动前端

# 方式 3: 分别启动
cd apps/backend && bun run dev
cd apps/frontend && bun run dev
```

### 生产构建

```bash
# 构建所有
bun run build

# 分别构建
bun run build:backend    # 后端构建到 apps/backend/dist
bun run build:frontend   # 前端构建到 apps/frontend/dist
```

## 📝 下一步扩展

### 添加共享包

```bash
# 创建共享 UI 组件库
mkdir -p packages/ui
cd packages/ui
bun init

# 创建共享工具函数
mkdir -p packages/utils
cd packages/utils
bun init
```

### 添加更多应用

```bash
# 创建管理后台
mkdir -p apps/admin
cd apps/admin
bun create vite .
```

## 🔗 相关文档

- [主 README](MONOREPO_README.md)
- [后端说明](apps/backend/README.md)
- [文件上传指南](docs/07-file_upload_guide.md)

## ⚠️ 注意事项

1. **上传目录**：统一使用根目录的 `/workspace/uploads/`
2. **端口分配**：
   - 前端：3000
   - 后端：3001
3. **依赖管理**：在根目录执行 `bun install` 安装所有依赖
4. **TypeScript**：每个 app 有独立的 tsconfig，根目录 tsconfig 继承前端配置

---

**创建时间**: 2026-06-12  
**架构**: Bun Monorepo (前后端分离)
