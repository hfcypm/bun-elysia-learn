# GitHub Actions 入门：React + Vite 自动构建部署指南 🚀

> 从零开始配置 CI/CD，实现代码提交后自动构建并部署  
> **预计时间**: 20 分钟 | **难度**: ⭐⭐ | **适用**: React + Vite 项目

---

## 📋 目录

1. [GitHub Actions 基础概念](#1-github-actions-基础概念)
2. [创建工作流文件](#2-创建工作流文件)
3. [React + Vite 构建配置](#3-react--vite-构建配置)
4. [部署到 GitHub Pages](#4-部署到-github-pages)
5. [部署到 Vercel](#5-部署到-vercel)
6. [部署到 Netlify](#6-部署到-netlify)
7. [部署到云服务器](#7-部署到云服务器)
8. [环境变量与密钥](#8-环境变量与密钥)
9. [最佳实践](#9-最佳实践)
10. [常见问题](#10-常见问题)

---

## 1. GitHub Actions 基础概念

### 1.1 核心术语

| 术语 | 说明 | 示例 |
|------|------|------|
| **Workflow** | 自动化工作流程 | CI/CD 流水线 |
| **Job** | 工作流中的任务组 | build、test、deploy |
| **Step** | 工作流中的单一步骤 | 运行命令、使用 Action |
| **Action** | 可复用的工作单元 | actions/checkout@v4 |
| **Runner** | 执行工作流的服务器 | ubuntu-latest |
| **Trigger** | 触发工作流的事件 | push、pull_request |

### 1.2 工作流程图

```
代码提交 (push)
    ↓
触发 Workflow
    ↓
执行 Job 1: Checkout
    ↓
执行 Job 2: Install Dependencies
    ↓
执行 Job 3: Build
    ↓
执行 Job 4: Deploy
    ↓
完成！✅
```

### 1.3 文件位置

```
你的项目/
├── .github/
│   └── workflows/       # ⚠️ 工作流文件放在这里
│       ├── ci.yml      # 持续集成
│       └── deploy.yml  # 持续部署
├── src/
├── public/
├── package.json
└── vite.config.ts
```

---

## 2. 创建工作流文件

### 2.1 创建目录结构

```bash
# 在项目根目录创建
mkdir -p .github/workflows
```

### 2.2 基础工作流模板

创建 `.github/workflows/deploy.yml`：

```yaml
# 工作流名称
name: Deploy React App

# 触发条件
on:
  push:
    branches:
      - main          # main 分支推送时触发
      - master        # 或 master 分支
  pull_request:
    branches:
      - main          # PR 到 main 分支时触发

# 环境变量（全局）
env:
  NODE_VERSION: '20'  # Node.js 版本

# 工作任务
jobs:
  # 任务名称
  build-and-deploy:
    # 运行环境
    runs-on: ubuntu-latest
    
    # 工作步骤
    steps:
      # Step 1: 检出代码
      - name: Checkout code
        uses: actions/checkout@v4
      
      # Step 2: 设置 Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'  # 缓存 node_modules
      
      # Step 3: 安装依赖
      - name: Install dependencies
        run: npm ci
      
      # Step 4: 构建项目
      - name: Build
        run: npm run build
      
      # Step 5: 部署
      - name: Deploy
        run: echo "Deploy step"
```

### 2.3 工作流语法详解

```yaml
# ============ 触发条件 ============
on:
  # 推送触发
  push:
    branches:
      - main              # 指定分支
      - 'release/*'       # 通配符
    paths:
      - 'src/**'          # 只监听 src 目录
      - 'package.json'    # 或特定文件
  
  # 定时触发 (Cron 表达式)
  schedule:
    - cron: '0 0 * * *'   # 每天 UTC 0 点
  
  # 手动触发
  workflow_dispatch:
      inputs:
        environment:
          description: '部署环境'
          required: true
          default: 'production'
          type: choice
          options:
            - production
            - staging

# ============ 任务配置 ============
jobs:
  job-name:
    # 运行系统
    runs-on: ubuntu-latest  # 或 windows-latest, macos-latest
    
    # 矩阵策略 (多环境测试)
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    
    # 步骤
    steps:
      - uses: actions/checkout@v4
      
      # 使用环境变量
      - run: echo "部署到 ${{ github.ref }}"
      
      # 条件执行
      - if: github.ref == 'refs/heads/main'
        run: echo "只在 main 分支执行"
```

### 2.4 常用环境变量

```yaml
# GitHub 自动提供的环境变量
${{ github.repository }}     # 仓库名 (owner/repo)
${{ github.ref }}            # 分支引用 (refs/heads/main)
${{ github.sha }}            # 提交 SHA
${{ github.actor }}          # 触发者用户名
${{ github.event_name }}     # 事件名称 (push/pull_request)
${{ github.run_id }}         # 运行 ID
${{ secrets.SECRET_NAME }}   # 加密的密钥
```

---

## 3. React + Vite 构建配置

### 3.1 完整构建工作流

创建 `.github/workflows/build.yml`：

```yaml
name: Build and Test

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check (TypeScript)
        run: npm run type-check
        continue-on-error: true  # 类型检查失败不影响流程
      
      - name: Run Tests
        run: npm run test
        env:
          CI: true
      
      - name: Build
        run: npm run build
      
      # 上传构建产物
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: dist/
          retention-days: 30
```

### 3.2 Vite 配置优化

编辑 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 基础路径（部署到 GitHub Pages 时需要）
  base: process.env.BASE_PATH || '/',
  
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 静态资源目录
    assetsDir: 'assets',
    
    // 生成 source map
    sourcemap: false,
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 生产环境移除 console
        drop_debugger: true
      }
    }
  },
  
  // 预览服务配置
  preview: {
    port: 4173,
    host: true
  }
});
```

### 3.3 package.json 脚本

```json
{
  "name": "react-vite-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 3.4 环境配置文件

创建 `.env.production`：

```env
# 生产环境变量
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App - Production
VITE_APP_VERSION=1.0.0
```

**⚠️ 注意**：`.env` 文件不要提交到 Git

```bash
# .gitignore
.env
.env.local
.env.*.local
```

---

## 4. 部署到 GitHub Pages

### 4.1 配置 Vite

编辑 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub 仓库信息
const REPO_NAME = 'your-username/your-repo';

export default defineConfig({
  plugins: [react()],
  
  // 关键配置：设置基础路径
  base: `https://${REPO_NAME}.github.io/${REPO_NAME.split('/')[1]}/`,
  
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```

### 4.2 创建工作流

创建 `.github/workflows/deploy-github-pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  
  # 允许手动触发
  workflow_dispatch:

# 设置 GITHUB_TOKEN 权限
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许一个并发部署
concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      # 上传构建产物
      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4.3 GitHub Pages 设置

1. **访问 GitHub 仓库** → Settings → Pages

2. **配置 Source**：
   - Source: GitHub Actions
   
3. **配置自定义域名**（可选）：
   - Custom domain: `your-domain.com`
   - ✅ 勾选 "Enforce HTTPS"

4. **访问网站**：
   ```
   https://your-username.github.io/your-repo/
   ```

### 4.4 处理 React Router

如果使用 React Router，需要添加 `404.html`：

创建 `public/404.html`：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      // 重定向到 index.html
      window.location.replace('/' + window.location.pathname.split('/')[1]);
    </script>
  </head>
  <body>
    Redirecting...
  </body>
</html>
```

复制为构建后文件：

```bash
# 在构建后执行
cp dist/index.html dist/404.html
```

或者在工作流中添加：

```yaml
- name: Copy index.html to 404.html
  run: cp dist/index.html dist/404.html
```

---

## 5. 部署到 Vercel

### 5.1 Vercel 项目设置

1. **访问 Vercel**：https://vercel.com
2. **导入 GitHub 仓库**
3. **配置构建设置**：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 5.2 自动部署工作流

创建 `.github/workflows/deploy-vercel.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

### 5.3 获取 Vercel Token

1. **访问 Vercel** → Account Settings → Tokens
2. **创建新 Token**：
   - 名称：GitHub Actions
   - 权限：Full Access
3. **复制 Token** 并添加到 GitHub Secrets：
   - 仓库 Settings → Secrets and variables → Actions
   - 添加：`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`

### 5.4 Vercel 配置文件（可选）

创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 6. 部署到 Netlify

### 6.1 Netlify 项目设置

1. **访问 Netlify**：https://netlify.com
2. **添加新站点** → Import from Git
3. **选择 GitHub 仓库**
4. **配置构建设置**：
   - Build command: `npm run build`
   - Publish directory: `dist`

### 6.2 自动部署工作流

创建 `.github/workflows/deploy-netlify.yml`：

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Deploy from GitHub Actions'
          enable-pull-request-comment: true
          enable-commit-comment: true
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        timeout-minutes: 10
```

### 6.3 获取 Netlify Token

1. **访问 Netlify** → User Settings → Applications → Personal access tokens
2. **创建新 Token**
3. **添加到 GitHub Secrets**：
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`（在站点设置中查看）

### 6.4 Netlify 配置文件（可选）

创建 `netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## 7. 部署到云服务器

### 7.1 使用 SSH 部署

创建 `.github/workflows/deploy-server.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      # 压缩构建文件
      - name: Compress Build Files
        run: tar -czf build.tar.gz dist/
      
      # 通过 SSH 部署
      - name: Deploy via SSH
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SERVER_HOST }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          REMOTE_PORT: ${{ secrets.SERVER_PORT }}
          SOURCE: 'build.tar.gz'
          TARGET: ${{ secrets.DEPLOY_PATH }}
          SCRIPT_BEFORE: |
            cd ${{ secrets.DEPLOY_PATH }}
            tar -xzf build.tar.gz
            rm build.tar.gz
          SCRIPT_AFTER: |
            echo "部署完成！"

      # 或者使用 rsync
      - name: Sync files via rsync
        uses: burnett01/rsync-deployments@v7
        with:
          switches: -avz --delete
          path: dist/
          remote_path: ${{ secrets.DEPLOY_PATH }}
          remote_host: ${{ secrets.SERVER_HOST }}
          remote_user: ${{ secrets.SERVER_USER }}
          remote_key: ${{ secrets.SSH_PRIVATE_KEY }}
```

### 7.2 生成 SSH 密钥

```bash
# 本地生成 SSH 密钥
ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key

# 查看公钥
cat github-actions-key.pub

# 将公钥添加到服务器
ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys" < github-actions-key.pub

# 将私钥添加到 GitHub Secrets
# Settings → Secrets and variables → Actions
# 添加：SSH_PRIVATE_KEY (复制 github-actions-key 文件内容)
```

### 7.3 配置服务器变量

在 GitHub Secrets 中添加：

```
SSH_PRIVATE_KEY       # SSH 私钥内容
SERVER_HOST           # 服务器 IP 或域名
SERVER_USER           # SSH 用户名 (如：root, ubuntu)
SERVER_PORT           # SSH 端口 (默认：22)
DEPLOY_PATH           # 部署目录 (如：/var/www/my-app)
```

### 7.4 Nginx 配置

在服务器上配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/my-app/dist;
    index index.html;

    # 支持 React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

## 8. 环境变量与密钥

### 8.1 GitHub Secrets 配置

**位置**：仓库 Settings → Secrets and variables → Actions

**添加密钥**：

| 密钥名称 | 说明 | 示例值 |
|----------|------|--------|
| `VERCEL_TOKEN` | Vercel 部署令牌 | `...` |
| `NETLIFY_AUTH_TOKEN` | Netlify 认证令牌 | `...` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | `-----BEGIN OPENSSH...` |
| `SERVER_HOST` | 服务器地址 | `192.168.1.1` |
| `DATABASE_URL` | 数据库连接 | `postgresql://...` |
| `API_KEY` | API 密钥 | `sk-...` |

### 8.2 在工作流中使用

```yaml
jobs:
  deploy:
    steps:
      # 使用密钥
      - name: Deploy
        run: |
          echo "部署到 ${{ secrets.SERVER_HOST }}"
          curl -H "Authorization: Bearer ${{ secrets.API_KEY }}" ...
      
      # 多行命令使用密钥
      - name: Deploy with SSH
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > key.pem
          chmod 600 key.pem
          scp -i key.pem dist/* user@server:/var/www/
          rm key.pem
```

### 8.3 环境特定配置

创建 `.github/workflows/deploy-multi-env.yml`：

```yaml
name: Deploy Multi-Environment

on:
  push:
    branches:
      - main      # 生产环境
      - staging   # 测试环境

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      # 根据分支选择环境文件
      - name: Build for Environment
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            cp .env.production .env
          else
            cp .env.staging .env
          fi
          npm run build
      
      - name: Deploy
        run: |
          # 部署逻辑
          echo "部署到 ${{ github.ref }}"
```

### 8.4 环境配置示例

创建 `.env.staging`：

```env
VITE_API_URL=https://staging-api.example.com
VITE_APP_TITLE=My App - Staging
VITE_APP_DEBUG=true
```

创建 `.env.production`：

```env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
VITE_APP_DEBUG=false
```

---

## 9. 最佳实践

### 9.1 工作流优化

```yaml
# ✅ 推荐：使用缓存加速
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'

# ✅ 推荐：使用 npm ci 而非 npm install
- name: Install Dependencies
  run: npm ci

# ✅ 推荐：限制并发部署
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# ✅ 推荐：设置超时时间
jobs:
  deploy:
    timeout-minutes: 30
```

### 9.2 安全检查

```yaml
# ✅ 推荐：添加代码检查
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Security Scan
        run: npm audit
      
      - name: Dependency Check
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 9.3 多环境部署策略

```yaml
# 分支策略
on:
  push:
    branches:
      - main        # 生产环境
      - staging     # 测试环境
      - develop     # 开发环境

# 标签策略
  pull_request:
    types: [closed]
    branches: [main]

# 手动触发
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [production, staging]
```

### 9.4 通知与监控

```yaml
# 添加部署通知
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: ${{ secrets.SLACK_CHANNEL }}
    payload: |
      {
        "text": "部署 ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*部署完成*\n仓库：${{ github.repository }}\n分支：${{ github.ref }}\n提交：${{ github.sha }}"
            }
          }
        ]
      }
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

# 添加部署状态检查
- name: Health Check
  run: |
    sleep 30  # 等待部署生效
    curl -f ${{ secrets.APP_URL }}/health || exit 1
```

### 9.5 回滚策略

```yaml
# 保留历史版本
- name: Upload Release
  uses: actions/upload-artifact@v4
  with:
    name: release-${{ github.sha }}
    path: dist/
    retention-days: 90

# 回滚工作流
- name: Rollback
  if: failure()
  run: |
    echo "部署失败，准备回滚"
    # 回滚逻辑
```

---

## 10. 常见问题

### Q1: 工作流不触发

**问题**: 代码提交后没有触发构建

**解决方案**:

```yaml
# 检查触发条件
on:
  push:
    branches:
      - main  # 确保分支名正确

# 检查工作流文件位置
# 必须是：.github/workflows/xxx.yml

# 检查分支是否正确
git branch -a  # 查看分支
git push origin main  # 推送到正确分支
```

### Q2: 构建失败

**问题**: npm run build 失败

**解决方案**:

```bash
# 本地复现构建
npm ci
npm run build

# 查看详细错误日志
# GitHub Actions → Actions → 选择运行 → 查看日志

# 常见问题:
# 1. Node.js 版本不匹配 → 更新 actions/setup-node 版本
# 2. 依赖缺失 → 检查 package.json
# 3. 类型错误 → 添加 continue-on-error: true
```

### Q3: 部署后页面空白

**问题**: 网站部署后打开是空白

**解决方案**:

```typescript
// 1. 检查 vite.config.ts 的 base 配置
export default defineConfig({
  base: '/repo-name/',  // GitHub Pages 需要
});

// 2. 检查路由配置 (React Router)
// 添加 404.html 文件
cp dist/index.html dist/404.html

// 3. 检查环境变量
console.log(import.meta.env.VITE_API_URL);
```

### Q4: 密钥无法访问

**问题**: secrets 无法使用

**解决方案**:

```yaml
# 1. 检查密钥名称（大小写敏感）
${{ secrets.MY_TOKEN }}  # 必须完全匹配

# 2. 检查密钥作用域
# 仓库级密钥 vs 组织级密钥

# 3. 添加权限配置
permissions:
  contents: read
  id-token: write
```

### Q5: 部署到 GitHub Pages 404

**问题**: 访问页面显示 404

**解决方案**:

```yaml
# 1. 检查 Pages 设置
# Settings → Pages → Source: GitHub Actions

# 2. 等待 DNS 传播（约 1-2 分钟）

# 3. 检查构建产物
# Actions → 检查 dist/ 是否正确上传

# 4. 使用正确的 URL
# https://username.github.io/repo-name/
```

### Q6: 缓存失效

**问题**: 部署后浏览器仍显示旧版本

**解决方案**:

```html
<!-- 1. 添加版本号 -->
<link rel="stylesheet" href="/styles.css?v=${{ github.sha }}">

<!-- 2. Vite 自动添加 hash -->
<!-- vite.config.ts 默认配置 -->
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
    }
  }
}

<!-- 3. 添加 meta 标签 -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
```

---

## 📚 参考资源

### 官方文档

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)

### 示例仓库

- [GitHub Actions 示例](https://github.com/actions/starter-workflows)
- [Vercel Actions 示例](https://github.com/amondnet/vercel-action)
- [Netlify Actions 示例](https://github.com/nwtgck/actions-netlify)

### 市场 Action

- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)

---

## 🎯 快速开始清单

```markdown
## 部署准备清单

- [ ] 创建 .github/workflows 目录
- [ ] 配置工作流文件 (deploy.yml)
- [ ] 测试本地构建 (npm run build)
- [ ] 提交并推送到 GitHub
- [ ] 检查 Actions 是否触发
- [ ] 配置部署平台 (选择一种):
  - [ ] GitHub Pages (设置 Pages Source)
  - [ ] Vercel (导入仓库)
  - [ ] Netlify (连接 GitHub)
  - [ ] 云服务器 (配置 SSH 密钥)
- [ ] 添加 Secrets (如需要)
- [ ] 验证部署成功
- [ ] 配置自定义域名 (可选)
- [ ] 设置分支保护规则 (可选)
```

---

**Happy Deploying! 🚀**

---

*最后更新：2026-06-03*
