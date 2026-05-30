@echo off
chcp 65001 >nul
title Elysia Learning

echo 🦊 Elysia.js 循序渐进学习项目
echo ======================================
echo.

@rem 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

@rem 检查 tsx
where tsx >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  未找到 tsx，正在全局安装...
    npm install -g tsx
)

:menu
echo.
echo 请选择要运行的案例：
echo.
echo Level 1 - 基础入门:
echo   1^) Hello Elysia
echo   2^) HTTP 方法与 CRUD
echo.
echo Level 2 - 进阶技能:
echo   3^) 请求验证
echo   4^) 中间件系统
echo   8^) 图片上传服务 (批量上传)
echo.
echo Level 3 - 实战项目:
echo   5^) 博客文章管理系统
echo   6^) JWT 认证系统
echo   7^) WebSocket 聊天室
echo.
echo 工具:
echo   0^) 退出
echo   i^) 安装依赖
echo   h^) 查看帮助
echo.
set /p choice=请输入选项 (1-7, 0, i, h): 

if "%choice%"=="1" goto case1
if "%choice%"=="2" goto case2
if "%choice%"=="3" goto case3
if "%choice%"=="4" goto case4
if "%choice%"=="5" goto case5
if "%choice%"=="6" goto case6
if "%choice%"=="7" goto case7
if /i "%choice%"=="i" goto install
if /i "%choice%"=="h" goto help
if "%choice%"=="0" goto end

echo ❌ 无效选项
pause
goto menu

:case1
echo 🚀 启动案例 1: Hello Elysia
npx tsx watch src/basic/01-hello.ts
goto end

:case2
echo 🚀 启动案例 2: HTTP 方法与 CRUD
npx tsx watch src/basic/02-http-methods.ts
goto end

:case3
echo 🚀 启动案例 3: 请求验证
npx tsx watch src/intermediate/03-validation.ts
goto end

:case4
echo 🚀 启动案例 4: 中间件系统
npx tsx watch src/intermediate/04-middleware.ts
goto end

:case8
echo 🚀 启动案例 8: 图片上传服务
npx tsx watch src/intermediate/05-file-upload.ts
goto end

:case5
echo 🚀 启动案例 5: 博客文章管理系统
npx tsx watch src/advanced/05-blog-api.ts
goto end

:case6
echo 🚀 启动案例 6: JWT 认证系统
npx tsx watch src/advanced/06-auth.ts
goto end

:case7
echo 🚀 启动案例 7: WebSocket 聊天室
npx tsx watch src/advanced/07-websocket.ts
goto end

:install
echo 📦 安装依赖...
call npm install
echo ✅ 安装完成
pause
goto menu

:help
echo.
echo 📖 帮助文档:
echo.
echo README.md - 项目介绍
echo docs/README.md - 学习指南
echo docs/LEARNING_PATH.md - 学习路径
echo docs/PRACTICE.md - 练习手册
echo docs/QUICK_REFERENCE.md - 快速参考
echo docs/INSTALLATION.md - 安装指南
echo.
pause
goto menu

:end
echo 👋 再见!
