# ⚡ 启动命令速查表

## 🎯 最常用命令

### 启动 Monorepo 服务

```bash
# 一键启动前后端（推荐）
./start-monorepo.sh

# 或使用命令
bun run dev
```

### 单独启动后端

```bash
# 方式 1: 使用脚本（推荐）
./start-backend.sh

# 方式 2: 使用 npm script
bun run dev:backend

# 方式 3: 进入目录
cd apps/backend && bun run dev
```

### 单独启动前端

```bash
# 方式 1: 使用脚本（推荐）
./start-frontend.sh

# 方式 2: 使用 npm script
bun run dev:frontend

# 方式 3: 进入目录
cd apps/frontend && bun run dev
```

---

## 📋 完整命令列表

### 根目录命令

| 命令 | 说明 | 端口 |
|------|------|------|
| `bun run dev` | 启动所有服务 | 3000, 3001 |
| `bun run dev:backend` | 只启动后端 | 3001 |
| `bun run dev:frontend` | 只启动前端 | 3000 |
| `bun run build` | 构建所有 | - |
| `bun run start` | 启动后端（生产） | 3001 |
| `bun run preview` | 预览前端构建 | 3000 |

### 脚本命令

| 脚本 | 说明 | 示例 |
|------|------|------|
| `./start-backend.sh` | 启动后端 | `./start-backend.sh dev` |
| `./start-frontend.sh` | 启动前端 | `./start-frontend.sh dev` |
| `./start-old-upload.sh` | 启动旧版上传 | `./start-old-upload.sh watch` |
| `./start-monorepo.sh` | 启动所有 | `./start-monorepo.sh` |

### 启动指定文件

```bash
# 直接运行单个文件
bun run src/02-intermediate/05-file-upload.ts

# Watch 模式（自动重载）
bun run --watch src/02-intermediate/05-file-upload.ts

# 使用 tsx
npx tsx src/02-intermediate/05-file-upload.ts
```

---

## 🔧 场景化命令

### 场景 1: 只开发后端 API

```bash
cd apps/backend
bun run dev
# http://localhost:3001
```

### 场景 2: 只开发前端界面

```bash
cd apps/frontend
bun run dev
# http://localhost:3000
```

### 场景 3: 前后端同时开发

```bash
# 方式 1
bun run dev

# 方式 2
./start-monorepo.sh

# 方式 3（两个终端）
# Terminal 1: cd apps/backend && bun run dev
# Terminal 2: cd apps/frontend && bun run dev
```

### 场景 4: 测试旧代码

```bash
bun run src/02-intermediate/05-file-upload.ts
# http://localhost:3007
```

### 场景 5: 运行示例代码

```bash
# Prisma 示例
bun run examples/08-prisma-basic-user.ts
bun run examples/09-prisma-blog.ts
bun run examples/10-prisma-ecommerce.ts
```

---

## 📊 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发 | 3000 | apps/frontend |
| 后端 API | 3001 | apps/backend |
| 旧版上传 | 3007 | src/05-file-upload.ts |

---

## 💡 快速检查

```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001
lsof -i :3007

# 检查进程
ps aux | grep bun
ps aux | grep vite

# 杀死进程
kill -9 <PID>
```

---

## 🎨 脚本参数

### start-backend.sh

```bash
./start-backend.sh dev     # 开发模式（默认）
./start-backend.sh start   # 生产模式
./start-backend.sh watch   # Watch 模式
```

### start-frontend.sh

```bash
./start-frontend.sh dev      # 开发模式（默认）
./start-frontend.sh build    # 构建
./start-frontend.sh preview  # 预览
```

### start-old-upload.sh

```bash
./start-old-upload.sh        # 运行（默认）
./start-old-upload.sh watch  # Watch 模式
./start-old-upload.sh dev 3008  # 指定端口
```

---

**最后更新**: 2026-06-12
