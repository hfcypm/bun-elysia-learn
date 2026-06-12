# 🚀 启动服务完整指南

## 📋 目录

1. [单独启动 Monorepo Apps](#单独启动-monorepo-apps)
2. [单独启动指定文件](#单独启动指定文件)
3. [常用命令速查](#常用命令速查)

---

## 🎯 单独启动 Monorepo Apps

### 1️⃣ 启动后端服务 (apps/backend)

**方式 A: 使用 npm scripts（推荐）**

```bash
# 进入后端目录
cd apps/backend

# 开发模式（热重载）
bun run dev

# 生产模式
bun run start

# 构建
bun run build
```

**方式 B: 直接运行文件**

```bash
cd apps/backend
bun run src/index.ts
```

**方式 C: 使用 watch 模式**

```bash
cd apps/backend
bun run --watch src/index.ts
```

**访问地址**:
- API: http://localhost:3001
- Swagger: http://localhost:3001/swagger

---

### 2️⃣ 启动前端服务 (apps/frontend)

**方式 A: 使用 npm scripts（推荐）**

```bash
# 进入前端目录
cd apps/frontend

# 开发模式（热重载）
bun run dev

# 构建生产版本
bun run build

# 预览构建结果
bun run preview
```

**方式 B: 直接启动 Vite**

```bash
cd apps/frontend
bunx vite
```

**访问地址**:
- 开发服务: http://localhost:3000

---

### 3️⃣ 从根目录启动

```bash
# 启动所有 apps
bun run dev

# 只启动后端
bun run dev:backend

# 只启动前端
bun run dev:frontend
```

---

---

## 🛠️ 使用启动脚本

项目提供了便捷的启动脚本，无需记住复杂的命令。

### start-backend.sh

启动后端服务，支持多种模式：

```bash
# 开发模式（热重载）- 默认
./start-backend.sh

# 或指定模式
./start-backend.sh dev      # 开发模式
./start-backend.sh start    # 生产模式
./start-backend.sh watch    # Watch 模式
```

**输出示例**:
```
🚀 启动后端服务...
📂 目录：/workspace/apps/backend
🔧 模式：dev
🌐 端口：3001
📚 Swagger: http://localhost:3001/swagger

✅ 开发模式（热重载）
$ bun run --watch src/index.ts
```

---

### start-frontend.sh

启动前端服务：

```bash
# 开发模式 - 默认
./start-frontend.sh

# 或指定模式
./start-frontend.sh dev      # 开发模式
./start-frontend.sh build    # 构建
./start-frontend.sh preview  # 预览
```

**输出示例**:
```
🎨 启动前端服务...
📂 目录：/workspace/apps/frontend
🔧 模式：dev
🌐 端口：3000

✅ 开发模式（Vite HMR）
$ vite
```

---

### start-old-upload.sh

启动旧版文件上传服务（用于兼容旧代码）：

```bash
# 运行一次
./start-old-upload.sh

# Watch 模式（自动重载）
./start-old-upload.sh watch

# 指定端口
./start-old-upload.sh dev 3008
```

**输出示例**:
```
📦 启动旧版文件上传服务...
🔧 模式：watch
🌐 端口：3007

✅ Watch 模式（自动重载）
```

---

### start-monorepo.sh

同时启动前后端服务：

```bash
./start-monorepo.sh
```

**输出示例**:
```
🚀 同时启动前后端服务...

📦 启动后端服务 (Port 3001)...
🎨 启动前端服务 (Port 3000)...

✅ 服务已启动!
   前端：http://localhost:3000
   后端：http://localhost:3001
```

---

## 📄 单独启动指定文件

### 场景 1: 启动旧的 src 目录文件

```bash
# 启动文件上传服务（旧版本 - Port 3007）
bun run src/02-intermediate/05-file-upload.ts

# 启动用户管理示例
bun run examples/08-prisma-basic-user.ts

# 启动博客系统示例
bun run examples/09-prisma-blog.ts

# 启动电商系统示例
bun run examples/10-prisma-ecommerce.ts
```

### 场景 2: 使用 tsx（TypeScript 执行器）

```bash
# 安装 tsx（如果未安装）
bun add -d tsx

# 使用 tsx 运行
npx tsx src/02-intermediate/05-file-upload.ts
npx tsx examples/08-prisma-basic-user.ts
```

### 场景 3: 使用 watch 模式自动重载

```bash
# 使用 Bun 原生 watch
bun run --watch src/02-intermediate/05-file-upload.ts

# 使用 tsx watch
npx tsx watch src/02-intermediate/05-file-upload.ts
```

---

## ⚡ 常用命令速查

### 根目录命令

```bash
# 安装所有依赖
bun install

# 启动所有服务
bun run dev

# 只启动后端
bun run dev:backend

# 只启动前端
bun run dev:frontend

# 构建所有
bun run build

# 类型检查
bun run typecheck
```

### 后端命令 (apps/backend)

```bash
cd apps/backend

# 开发模式
bun run dev

# 生产模式
bun run start

# 直接运行
bun run src/index.ts

# Watch 模式
bun run --watch src/index.ts

# 构建
bun run build
```

### 前端命令 (apps/frontend)

```bash
cd apps/frontend

# 开发模式
bun run dev

# 构建
bun run build

# 预览
bun run preview

# 直接启动 Vite
bunx vite
```

### 旧文件命令 (src/)

```bash
# 直接运行单个文件
bun run src/02-intermediate/05-file-upload.ts

# Watch 模式
bun run --watch src/02-intermediate/05-file-upload.ts

# 使用 tsx
npx tsx src/02-intermediate/05-file-upload.ts
```

---

## 🔧 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| **apps/backend** | 3001 | 新版文件上传 API |
| **apps/frontend** | 3000 | React 前端界面 |
| **src/05-file-upload.ts** | 3007 | 旧版文件上传（独立运行） |

---

## 💡 使用场景

### 场景 1: 只开发后端 API

```bash
cd apps/backend
bun run dev
# 访问 http://localhost:3001
```

### 场景 2: 只开发前端界面

```bash
cd apps/frontend
bun run dev
# 访问 http://localhost:3000
```

### 场景 3: 前后端同时开发

```bash
# 方式 A: 使用根目录命令
bun run dev

# 方式 B: 使用启动脚本
./start-monorepo.sh

# 方式 C: 打开两个终端
# Terminal 1
cd apps/backend && bun run dev

# Terminal 2
cd apps/frontend && bun run dev
```

### 场景 4: 测试旧版本文件

```bash
# 运行旧版文件上传服务（Port 3007）
bun run src/02-intermediate/05-file-upload.ts

# 访问 http://localhost:3007
```

### 场景 5: 同时多个服务

```bash
# Terminal 1: 新版后端 (3001)
cd apps/backend && bun run dev

# Terminal 2: 旧版服务 (3007)
bun run src/02-intermediate/05-file-upload.ts

# Terminal 3: 前端 (3000)
cd apps/frontend && bun run dev
```

---

## 🔧 故障排除

### 问题 1: 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001
lsof -i :3007

# 杀死进程
kill -9 <PID>
```

### 问题 2: 权限问题

```bash
# 添加执行权限
chmod +x start-backend.sh start-frontend.sh start-old-upload.sh start-monorepo.sh
```

### 问题 3: 依赖未安装

```bash
# 清理并重新安装
rm -rf node_modules apps/*/node_modules
bun install
```

---

## 📚 相关文档

### 1. 端口冲突

确保端口未被占用：

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001
lsof -i :3007

# 杀死占用端口的进程
kill -9 <PID>
```

### 2. 依赖安装

```bash
# 在根目录安装所有依赖（推荐）
bun install

# 或分别在每个目录安装
cd apps/backend && bun install
cd apps/frontend && bun install
```

### 3. 环境变量

```bash
# 设置环境变量后启动
PORT=3001 bun run src/index.ts

# 或使用 .env 文件
cp .env.example .env
bun run dev
```

### 4. 文件存储路径

```bash
# apps/backend 使用
/workspace/uploads/

# src/05-file-upload.ts 使用
/workspace/uploads/
```

---

## 📊 服务对比

| 特性 | apps/backend | src/旧文件 |
|------|-------------|-----------|
| **端口** | 3001 | 3007 |
| **框架** | Elysia 1.4+ | Elysia 1.1+ |
| **启动方式** | `bun run dev` | `bun run src/xxx.ts` |
| **热重载** | ✅ (watch) | ✅ (watch) |
| **Swagger** | ✅ | ❌ |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 推荐实践

### ✅ 推荐：使用 Monorepo 结构

```bash
# 开发新模式
cd apps/backend && bun run dev
cd apps/frontend && bun run dev
```

### ⚠️ 不推荐：继续使用旧文件

```bash
# 旧模式（仅用于学习）
bun run src/02-intermediate/05-file-upload.ts
```

---

## 📚 相关文档

- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [MONOREPO_README.md](MONOREPO_README.md) - Monorepo 主文档
- [apps/backend/README.md](apps/backend/README.md) - 后端文档

---

**最后更新**: 2026-06-12  
**模式**: Bun Monorepo + 旧文件兼容性
