# 安装和环境配置指南

## 📋 系统要求

- **操作系统**: Windows 10+, macOS 10.15+, Linux (推荐 Ubuntu 20.04+)
- **运行时**: Node.js 18+ 或 Bun 1.0+
- **包管理器**: npm / yarn / pnpm / bun
- **代码编辑器**: VS Code (推荐)

## 🔧 环境安装

### 方式一：使用 Bun (推荐)

Bun 是一个现代化的 JavaScript 运行时，性能比 Node.js 快 3-4 倍。

#### 安装 Bun

**macOS / Linux:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**

```powershell
powershell -c "iwr https://bun.sh/install.ps1 -useb | iex"
```

**验证安装:**

```bash
bun --version
```

如果显示版本号，说明安装成功。

#### 使用 Bun 运行项目

```bash
cd elysia-learning
bun install
bun run dev:basic
```

---

### 方式二：使用 Node.js

如果你不想使用 Bun，也可以使用 Node.js。

#### 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装 LTS 版本
3. 验证安装：

```bash
node --version
npm --version
```

#### 使用 Node.js 运行项目

```bash
cd elysia-learning
npm install
npx tsx src/basic/01-hello.ts
```

---

## 💻 编辑器配置

### VS Code 推荐扩展

1. **Elysia Snippets** - Elysia 代码片段
2. **TypeScript** - TypeScript 支持
3. **ESLint** - 代码检查
4. **Prettier** - 代码格式化
5. **Thunder Client** - API 测试工具

### 配置 TypeScript

创建 `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd elysia-learning
```

### 2. 安装依赖

**使用 Bun:**

```bash
bun install
```

**使用 npm:**

```bash
npm install
```

**使用 yarn:**

```bash
yarn install
```

**使用 pnpm:**

```bash
pnpm install
```

### 3. 运行第一个示例

```bash
# 启动 Level 1 案例 1
npm run dev:basic
```

打开浏览器访问 `http://localhost:3000`

---

## 📝 安装问题排查

### 问题 1: Bun 安装失败

**解决方法:**

```bash
# 使用 npm 全局安装 tsx 作为替代
npm install -g tsx

# 然后使用 npx 运行
npx tsx src/basic/01-hello.ts
```

### 问题 2: 端口被占用

**错误信息:**

```
Error: Address already in use
```

**解决方法:**

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 问题 3: TypeScript 编译错误

**解决方法:**

```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install

# 或重新安装依赖
rm -rf node_modules
npm install
```

---

## 🔍 验证安装

运行以下命令验证环境配置正确：

```bash
# 测试 Bun 安装
bun --version

# 测试 Node.js 安装
node --version
npm --version

# 安装项目依赖
npm install

# 测试运行
npx tsx src/basic/01-hello.ts
```

如果服务成功启动并显示欢迎信息，说明环境配置成功！

---

## 🎯 下一步

环境配置完成后，按照以下步骤开始学习：

1. 阅读 [README.md](../README.md) 了解项目结构
2. 查看 [LEARNING_PATH.md](LEARNING_PATH.md) 了解学习路线
3. 运行第一个案例：`npm run dev:basic`
4. 使用 Postman Collection 测试 API

祝你学习顺利！🚀
