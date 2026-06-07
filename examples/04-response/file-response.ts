/**
 * 示例片段: File Response
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习特定功能点
 * 2. ✅ 理解代码实现细节
 * 3. ✅ 可以组合到项目中
 * 
 * ⚠️ 注意事项：
 * - 示例代码可以复制使用
 * - 根据需求调整配置
 * - 参考完整案例学习
 * 
 * 📝 练习任务：
 * - 运行示例
 * - 修改参数测试
 * - 集成到自己的项目
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia } from 'elysia'
import { readFileSync } from 'fs'
import { join } from 'path'

const app = new Elysia()
  // 下载文本文件
  .get('/download/text', ({ set }) => {
    const content = `这是一个示例文本文件
创建时间：${new Date().toISOString()}
作者：Elysia Learning
描述：用于演示文件下载功能
`
    
    set.headers['Content-Type'] = 'text/plain; charset=utf-8'
    set.headers['Content-Disposition'] = 'attachment; filename="example.txt"'
    set.headers['Content-Length'] = Buffer.byteLength(content).toString()
    
    return content
  })

  // 下载 JSON 文件
  .get('/download/json', ({ set }) => {
    const data = {
      message: 'Hello World',
      timestamp: new Date().toISOString(),
      items: [1, 2, 3, 4, 5]
    }
    
    const content = JSON.stringify(data, null, 2)
    
    set.headers['Content-Type'] = 'application/json'
    set.headers['Content-Disposition'] = 'attachment; filename="data.json"'
    
    return content
  })

  // 下载 CSV 文件
  .get('/download/csv', ({ set }) => {
    const csvData = `ID,姓名，年龄，城市
1,张三，25，北京
2,李四，30，上海
3,王五，28，广州
4,赵六，35，深圳
`
    
    set.headers['Content-Type'] = 'text/csv; charset=utf-8'
    set.headers['Content-Disposition'] = 'attachment; filename="users.csv"'
    
    return csvData
  })

  // 下载 HTML 报告
  .get('/download/report', ({ set }) => {
    const html = `<!DOCTYPE html>
<html>
<head><title>示例报告</title></head>
<body>
  <h1>示例报告</h1>
  <p>生成时间：${new Date().toISOString()}</p>
  <table border="1">
    <tr><th>项目</th><th>值</th></tr>
    <tr><td>用户数</td><td>1000</td></tr>
    <tr><td>订单数</td><td>5000</td></tr>
    <tr><td>销售额</td><td>¥1,000,000</td></tr>
  </table>
</body>
</html>`
    
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    set.headers['Content-Disposition'] = 'attachment; filename="report.html"'
    
    return html
  })

  // 显示而非下载
  .get('/view/text', ({ set }) => {
    set.headers['Content-Type'] = 'text/plain; charset=utf-8'
    set.headers['Content-Disposition'] = 'inline'
    return '这段文字会在浏览器中直接显示，而不是下载'
  })

  // 批量文件打包下载信息
  .get('/download/batch', ({ set }) => {
    const files = [
      { name: 'report.txt', size: 1024 },
      { name: 'data.csv', size: 2048 },
      { name: 'summary.json', size: 512 }
    ]
    
    set.headers['Content-Type'] = 'application/json'
    
    return {
      message: '批量下载示例',
      files,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      note: '实际项目中应使用 zip 库打包文件'
    }
  })

  // 文件下载说明
  .get('/download-info', () => {
    return {
      message: '文件下载示例',
      'Content-Disposition': {
        'attachment; filename="test.txt"': '作为附件下载',
        'inline': '在浏览器中显示'
      },
      'Content-Type': {
        'text/plain': '纯文本',
        'application/json': 'JSON 文件',
        'text/csv': 'CSV 文件',
        'text/html': 'HTML 文件'
      },
      endpoints: {
        '/download/text': '下载文本文件',
        '/download/json': '下载 JSON 文件',
        '/download/csv': '下载 CSV 文件',
        '/download/report': '下载 HTML 报告',
        '/view/text': '在浏览器中显示'
      }
    }
  })

app.listen(3401, () => {
  console.log('?? 服务器运行在 http://localhost:3401')
  console.log('\n📝 测试接口:')
  console.log('   GET /download-info     - 查看下载说明')
  console.log('   GET /download/text     - 下载 TXT 文件')
  console.log('   GET /download/json     - 下载 JSON 文件')
  console.log('   GET /download/csv      - 下载 CSV 文件')
  console.log('   GET /download/report   - 下载 HTML 报告')
  console.log('   GET /view/text         - 在浏览器显示')
  console.log('\n💡 直接访问这些 URL，浏览器会提示下载文件')
})
