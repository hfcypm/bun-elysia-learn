/**
 * 示例片段：压缩插件
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现
 * 3. ✅ 可以组合使用
 * 
 * ⚠️ 注意事项：
 * - 示例代码可复制
 * - 按需调整配置
 * - 参考完整案例
 * 
 * 📝 练习任务：
 * - 配置插件选项
 * - 添加插件功能
 * - 参考官方文档
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run examples/05-plugins/compression.ts
 */

import { Elysia } from 'elysia'
import { compress } from '@elysiajs/compress'

const app = new Elysia()
  // 使用压缩插件
  .use(
    compress({
      // 最小压缩大小 (字节)
      threshold: 1024,
      // Gzip 配置
      gzip: {
        level: 6 // 压缩级别 1-9, 默认 6
      },
      // Brotli 配置 (通常有更好的压缩率)
      brotli: {
        quality: 11 // 压缩质量 0-11, 默认 11
      }
    })
  )
  
  // 主页
  .get('/', () => ({
    message: '压缩插件示例',
    description: '本示例返回较大响应以演示压缩效果',
    tips: [
      '使用 curl -H "Accept-Encoding: gzip" 测试 Gzip 压缩',
      '使用 curl -H "Accept-Encoding: br" 测试 Brotli 压缩',
      '比较压缩前后的 Content-Length'
    ]
  }))

  // 返回大文本
  .get('/text/large', () => {
    // 生成较大的文本内容
    const paragraphs = []
    for (let i = 1; i <= 100; i++) {
      paragraphs.push(
        `段落 ${i}: 这是一段示例文本，用于演示压缩效果。` +
        `Elysia.js 是一个基于 Bun 的高性能 Web 框架，` +
        `提供了优秀的开发体验和运行性能。压缩插件可以` +
        `自动对响应内容进行 Gzip 或 Brotli 压缩，减少` +
        `网络传输的数据量，提高页面加载速度。Lorem ipsum ` +
        `dolor sit amet, consectetur adipiscing elit. ` +
        `Repeated content for compression demonstration ${i}.`
      )
    }

    return {
      title: '大型文本响应',
      totalParagraphs: 100,
      content: paragraphs.join('\n\n'),
      note: '观察响应头中的 Content-Encoding 字段'
    }
  })

  // 返回 JSON 数据
  .get('/json/large', () => {
    // 生成大型 JSON 数据
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      stats: {
        totalUsers: 10000,
        activeUsers: 2500,
        newUsers: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          username: `user_${i + 1}`,
          email: `user${i + 1}@example.com`,
          registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            avatar: `https://example.com/avatars/${i + 1}.jpg`,
            bio: '这是一个用户简介，用于测试压缩效果。'.repeat(10)
          }
        }))
      },
      metadata: {
        generated: true,
        compressed: true,
        encoding: 'auto-detect'
      }
    }

    return data
  })

  // 模拟 API 响应
  .get('/api/data', () => {
    const data = Array.from({ length: 500 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `这是第 ${i + 1} 个项目的详细描述。`.repeat(5),
      price: Math.round(Math.random() * 10000) / 100,
      inStock: Math.random() > 0.3,
      categories: ['Electronics', 'Books', 'Clothing', 'Home'].slice(0, Math.floor(Math.random() * 4) + 1),
      tags: Array.from({ length: 5 }, (_, j) => `tag-${j + 1}`)
    }))

    return {
      success: true,
      count: data.length,
      data
    }
  })

  .listen(3011)

console.log('🗜️ 压缩服务运行在 http://localhost:3011')
console.log('📖 测试端点:')
console.log('   GET / - 首页')
console.log('   GET /text/large - 大型文本响应')
console.log('   GET /json/large - 大型 JSON 响应')
console.log('   GET /api/data - API 数据响应')
console.log('')
console.log('💡 测试压缩效果:')
console.log('   # 测试 Gzip 压缩')
console.log('   curl -H "Accept-Encoding: gzip" -I http://localhost:3011/json/large')
console.log('')
console.log('   # 测试 Brotli 压缩')
console.log('   curl -H "Accept-Encoding: br" -I http://localhost:3011/json/large')
console.log('')
console.log('   # 压缩与未压缩对比')
console.log('   curl -H "Accept-Encoding: identity" http://localhost:3011/json/large | wc -c')
console.log('   curl -H "Accept-Encoding: gzip" http://localhost:3011/json/large | wc -c')

export type CompressApp = typeof app
