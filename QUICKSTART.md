# 🚀 Bun Monorepo 快速开始指南

## ✅ 重构完成

项目已成功重构为 **Bun Monorepo**架构，前后端分离开发。

---

## 📋 项目结构

```
/workspace
├── apps/
│   ├── backend/          # 后端 (Elysia + Bun) - Port 3001
│   └── frontend/         # 前端 (React + Vite + Tailwind) - Port 3000
├── uploads/              # 上传文件存储
├── package.json          # Monorepo 配置
└── start-monorepo.sh     # 启动脚本
```

---

## 🎯 快速开始（3 步）

### 1️⃣ 安装依赖

```bash
cd /workspace
bun install
```

### 2️⃣ 启动服务

**方式 A: 使用启动脚本（推荐）**

```bash
./start-monorepo.sh
```

**方式 B: 使用 Monorepo 命令**

```bash
# 同时启动前后端
bun run dev

# 只启动后端
bun run dev:backend

# 只启动前端
bun run dev:frontend
```

**方式 C: 分别启动**

```bash
# 终端 1 - 后端
cd apps/backend
bun run dev

# 终端 2 - 前端
cd apps/frontend
bun run dev
```

### 3️⃣ 访问应用

- 🌐 **前端界面**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:3001
- 📚 **Swagger 文档**: http://localhost:3001/swagger

---

## 🧪 测试上传功能

### 方式 1: 使用前端界面

1. 打开 http://localhost:3000
2. 点击"📁 选择文件"
3. 选择图片
4. 点击"⬆️ 上传"
5. 查看上传结果和文件列表

### 方式 2: 使用 curl 命令

```bash
# 单文件上传
curl -X POST http://localhost:3001/upload \
  -F "image=@/path/to/image.jpg"

# 批量上传
curl -X POST http://localhost:3001/upload/batch \
  -F "images=@file1.jpg" \
  -F "images=@file2.png"

# 查看文件列表
curl http://localhost:3001/files

# 删除文件
curl -X DELETE http://localhost:3001/files/img_xxx
```

---

## 🔧 常用命令

### 开发

```bash
bun run dev              # 启动所有服务
bun run dev:backend      # 只启动后端
bun run dev:frontend     # 只启动前端
```

### 构建

```bash
bun run build            # 构建所有
bun run build:backend    # 构建后端
bun run build:frontend   # 构建前端
```

### 其他

```bash
bun run typecheck        # 类型检查
bun run lint             # 代码检查
bun run clean            # 清理构建产物
bun run install:all      # 重新安装所有依赖
```

---

## 📦 Tech Stack

### Backend (apps/backend)

| 技术 | 版本 | 说明 |
|------|------|------|
| **Bun** | 1.3+ | 运行时 |
| **Elysia** | 1.4+ | Web 框架 |
| **TypeScript** | 5.7+ | 类型系统 |

### Frontend (apps/frontend)

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.3+ | UI 框架 |
| **Vite** | 5.3+ | 构建工具 |
| **Tailwind CSS** | 3.4+ | CSS 框架 |
| **TypeScript** | 5.2+ | 类型系统 |

---

## 🔗 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/upload` | POST | 单文件上传 |
| `/upload/batch` | POST | 批量上传（最多 10 个） |
| `/files` | GET | 文件列表 |
| `/files/:id` | GET | 文件详情 |
| `/files/:id` | DELETE | 删除文件 |
| `/files/batch-delete` | POST | 批量删除 |
| `/static/uploads/:filename` | GET | 访问上传文件 |
| `/upload/config` | GET | 上传配置 |
| `/stats` | GET | 统计信息 |
| `/health` | GET | 健康检查 |

---

## ⚠️ 重要提示

### 1. 端口占用

确保这些端口未被占用：
- **3000** - 前端开发服务器
- **3001** - 后端 API 服务器

### 2. 上传目录

所有上传文件保存在：`/workspace/uploads/`

即使后端运行在 `apps/backend/`，文件也会存储到根目录的 `uploads/` 文件夹。

### 3. 跨域问题

**开发环境**：已配置 Vite 代理，无需担心 CORS

**生产环境**：需要在后端配置 CORS

### 4. 热重载

- 后端：使用 `--watch` 模式，修改后自动重启
- 前端：Vite HMR，修改后即时更新

---

## 🐛 故障排除

### 问题 1: 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

### 问题 2: 依赖未安装

```bash
# 清理并重新安装
rm -rf node_modules apps/*/node_modules
bun install
```

### 问题 3: 构建失败

```bash
# 清理构建缓存
bun run clean

# 重新构建
bun run build
```

---

## 📚 更多文档

- [Monorepo 架构说明](MONOREPO_README.md)
- [项目结构详解](MONOREPO_STRUCTURE.md)
- [后端 API 文档](apps/backend/README.md)
- [文件上传指南](docs/07-file_upload_guide.md)

---

## 🎉 下一步

1. ✅ 测试文件上传功能
2. 📱 尝试批量上传
3. 🗑️ 测试删除功能
4. 🔍 查看 Swagger 文档
5. 📦 考虑添加共享包 (packages/)

---

**最后更新**: 2026-06-12  
**模式**: Bun Monorepo (前后端分离)
