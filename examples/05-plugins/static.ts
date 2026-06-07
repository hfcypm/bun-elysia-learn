/**
 * 示例片段: Static
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习 Elysia 插件使用
 * 2. ✅ 理解插件的安装和配置
 * 3. ✅ 扩展应用功能
 * 4. ✅ 参考官方插件文档
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3010，被占用请修改
 * - 限制上传文件大小
 * - 验证文件类型
 * - 注意文件存储安全
 * - 示例代码可直接复制
 * - 根据项目需求调整
 * - 参考完整案例深入学习
 * 
 * 📝 练习任务：
 * - 运行示例测试效果
 * - 修改参数观察变化
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/05-plugins/static.ts
 * 测试：http://localhost:3010
 */

import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'

const app = new Elysia()
  // 使用静态文件插件
  .use(
    staticPlugin({
      // 静态文件目录
      assets: './public',
      // 前缀路径
      prefix: '/static',
      // 缓存配置
      maxAge: 3600, // 1 小时
      // 启用压缩 (如果文件存在 .gz 或 .br 版本)
      compress: true
    })
  )
  
  // 主页
  .get('/', () => ({
    message: '静态文件服务示例',
    staticFiles: '/static/*',
    examples: {
      html: '/static/index.html',
      css: '/static/styles.css',
      js: '/static/app.js',
      image: '/static/logo.png'
    }
  }))

  // 手动提供单个文件
  .get('/file/:filename', ({ params, set }) => {
    const { filename } = params
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join('./public', filename)

    if (!fs.existsSync(filePath)) {
      set.status = 404
      return { error: '文件不存在' }
    }

    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    }

    set.headers['Content-Type'] = mimeTypes[ext] || 'application/octet-stream'
    set.headers['Cache-Control'] = 'public, max-age=3600'

    return fs.readFileSync(filePath)
  })

  .listen(3010)

console.log('📁 静态文件服务运行在 http://localhost:3010')
console.log('📖 使用说明:')
console.log('   1. 在项目根目录创建 public 文件夹')
console.log('   2. 将静态文件放入 public 目录')
console.log('   3. 通过 /static/文件名 访问')
console.log('')
console.log('示例文件结构:')
console.log('   public/')
console.log('   ├── index.html')
console.log('   ├── styles.css')
console.log('   ├── app.js')
console.log('   └── images/')
console.log('       └── logo.png')
console.log('')
console.log('访问方式:')
console.log('   http://localhost:3010/static/index.html')
console.log('   http://localhost:3010/static/styles.css')
console.log('   http://localhost:3010/static/images/logo.png')

export type StaticApp = typeof app
