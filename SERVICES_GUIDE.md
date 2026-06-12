# 🚀 服务管理完整指南

## 📊 服务端口分配

| 服务类型 | 文件路径 | 端口 | 说明 |
|---------|---------|------|------|
| **Monorepo 前端** | `apps/frontend/` | 3000 | React 文件上传界面 |
| **Monorepo 后端** | `apps/backend/` | 3001 | 文件上传 API |
| **验证服务** | `src/02-intermediate/03-validation.ts` | 3002 | 数据验证示例 |
| **中间件服务** | `src/02-intermediate/04-middleware.ts` | 3003 | 中间件示例 |
| **文件上传 (旧)** | `src/02-intermediate/05-file-upload.ts` | 3007 | 旧版文件上传 |
| **SQLite 数据库** | `src/02-intermediate/06-database-sqlite.ts` | 3008 | SQLite 示例 |
| **PostgreSQL** | `src/02-intermediate/07-database-postgres.ts` | 3009 | PostgreSQL 示例 |
| **日志系统** | `src/02-intermediate/08-logging.ts` | 3010 | 日志示例 |
| **Prisma ORM** | `src/02-intermediate/08-prisma-orm.ts` | 3011 | Prisma 示例 |

---

## 🎯 启动单个服务

### 方式 1: 直接运行

```bash
# 启动验证服务
bun run src/02-intermediate/03-validation.ts

# 启动中间件服务
bun run src/02-intermediate/04-middleware.ts

# 启动旧版文件上传
bun run src/02-intermediate/05-file-upload.ts

# 启动 PostgreSQL 示例
bun run src/02-intermediate/07-database-postgres.ts
```

### 方式 2: 使用 Watch 模式（推荐）

```bash
# 自动重载
bun run --watch src/02-intermediate/03-validation.ts

# 或
bun run --watch src/02-intermediate/05-file-upload.ts
```

### 方式 3: 使用启动脚本

```bash
./start-example.sh validation    # 启动验证服务（Port 3002）
./start-example.sh middleware    # 启动中间件服务（Port 3003）
./start-example.sh upload-old    # 启动旧版上传（Port 3007）
./start-example.sh sqlite        # 启动 SQLite 示例（Port 3008）
./start-example.sh postgres      # 启动 PostgreSQL 示例（Port 3009）
./start-example.sh logging       # 启动日志服务（Port 3010）
./start-example.sh prisma        # 启动 Prisma 示例（Port 3011）
```

---

## 🔧 同时启动多个服务

### 场景 1: 测试验证 + 中间件

```bash
# Terminal 1
bun run --watch src/02-intermediate/03-validation.ts

# Terminal 2
bun run --watch src/02-intermediate/04-middleware.ts
```

**访问地址**:
- http://localhost:3002 - 验证服务
- http://localhost:3003 - 中间件服务

### 场景 2: Monorepo + 旧版上传

```bash
# Terminal 1: Monorepo 后端
cd apps/backend && bun run dev

# Terminal 2: Monorepo 前端
cd apps/frontend && bun run dev

# Terminal 3: 旧版上传服务
bun run --watch src/02-intermediate/05-file-upload.ts
```

**访问地址**:
- http://localhost:3000 - Monorepo 前端
- http://localhost:3001 - Monorepo 后端
- http://localhost:3007 - 旧版上传服务

### 场景 3: 数据库对比测试

```bash
# Terminal 1: SQLite
bun run --watch src/02-intermediate/06-database-sqlite.ts

# Terminal 2: PostgreSQL
bun run --watch src/02-intermediate/07-database-postgres.ts

# Terminal 3: Prisma
bun run --watch src/02-intermediate/08-prisma-orm.ts
```

**访问地址**:
- http://localhost:3008 - SQLite 示例
- http://localhost:3009 - PostgreSQL 示例
- http://localhost:3011 - Prisma 示例

---

## 📱 测试各服务功能

### 1. 验证服务 (Port 3002)

```bash
# 测试请求
curl -X POST http://localhost:3002/validate \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "age": 25}'
```

### 2. 中间件服务 (Port 3003)

```bash
# 测试请求
curl http://localhost:3003/
curl http://localhost:3003/protected
```

### 3. 文件上传服务 (Port 3007)

```bash
# 上传文件
curl -X POST http://localhost:3007/upload \
  -F "image=@test.jpg"

# 或访问前端界面
curl http://localhost:3007/
```

### 4. PostgreSQL 服务 (Port 3009)

```bash
# 测试请求
curl http://localhost:3009/
curl http://localhost:3009/users
```

---

## 🎛️ 使用管理脚本

### start-example.sh 脚本

```bash
# 使用方式
./start-example.sh <服务名> [watch|normal]

# 示例
./start-example.sh validation watch    # Watch 模式启动验证服务
./start-example.sh middleware normal   # 普通模式启动中间件
./start-example.sh all                 # 显示所有可用服务
```

### stop-all.sh 脚本

```bash
# 停止所有 Bun 服务
./stop-all.sh
```

---

## 📋 常用测试场景

### 场景 1: 学习 Elysia 基础

```bash
# 步骤 1: 启动验证服务
./start-example.sh validation watch

# 在浏览器访问 http://localhost:3002
# 查看源码 src/02-intermediate/03-validation.ts

# 步骤 2: 启动中间件服务
./start-example.sh middleware watch

# 在浏览器访问 http://localhost:3003
# 查看源码 src/02-intermediate/04-middleware.ts
```

### 场景 2: 测试文件上传

**方案 A - 使用新版 Monorepo**:
```bash
./start-monorepo.sh
# 访问 http://localhost:3000
```

**方案 B - 使用旧版独立服务**:
```bash
./start-example.sh upload-old watch
# 访问 http://localhost:3007
```

### 场景 3: 数据库功能测试

```bash
# SQLite 测试
./start-example.sh sqlite watch
curl http://localhost:3008/users -X POST -H "Content-Type: application/json" -d '{"name":"张三"}'

# PostgreSQL 测试
./start-example.sh postgres watch
curl http://localhost:3009/users

# Prisma 测试（需要先安装依赖）
./start-example.sh prisma watch
```

---

## ⚠️ 注意事项

### 1. 端口冲突

如果端口被占用：
```bash
# 查看占用端口的进程
lsof -i :3002
lsof -i :3003

# 杀死进程
kill -9 <PID>
```

### 2. 资源占用

- 每个服务占用约 50-100MB 内存
- 建议同时运行不超过 5 个服务
- 不用的服务及时停止

### 3. 依赖管理

```bash
# 确保所有依赖已安装
cd /workspace
bun install

# 检查特定服务的依赖
cd src/02-intermediate
bun install
```

---

## 🎯 推荐工作流

### 日常开发

```bash
# 1. 启动 Monorepo 主服务
./start-monorepo.sh

# 2. 根据需要启动其他服务
./start-example.sh validation watch
./start-example.sh middleware watch

# 3. 完成工作后停止所有
./stop-all.sh
```

### 学习测试

```bash
# 1. 启动要测试的服务
./start-example.sh validation watch

# 2. 在浏览器测试功能
# http://localhost:3002

# 3. 修改代码自动重载
# 查看控制台输出

# 4. 测试完成后停止
./stop-all.sh
```

---

## 📚 相关文档

- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [COMMANDS_CHEATSHEET.md](COMMANDS_CHEATSHEET.md) - 命令速查
- [STARTUP_GUIDE.md](STARTUP_GUIDE.md) - 启动指南

---

**最后更新**: 2026-06-12  
**服务总数**: 9 个独立服务

