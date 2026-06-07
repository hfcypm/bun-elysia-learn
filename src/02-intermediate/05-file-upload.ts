/**
 * Level 2 - 进阶技能: File Upload
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 掌握请求验证（TypeBox）
 * 2. ✅ 理解中间件的工作原理
 * 3. ✅ 实现文件上传功能
 * 4. ✅ 掌握数据库 CRUD 操作
 * 5. ✅ 使用 Prisma ORM
 * 
 * ⚠️ 注意事项：
 * - 验证失败会返回 400 状态码
 * - 中间件按顺序执行
 * - 文件上传注意大小限制
 * - 数据库连接需要正确配置
 * - Prisma 需要先 generate
 * 
 * 📝 练习任务：
 * - 添加更多验证规则
 * - 实现自定义中间件
 * - 扩展数据库模型
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'

// 模拟文件存储
interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  uploadedAt: string
  url: string
}

const files = new Map<string, UploadedFile>()
let fileCounter = 0

// 验证配置
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_BATCH_SIZE = 10 // 最多批量上传 10 张

const app = new Elysia()
  // ========== 单文件上传 ==========
  .post('/upload', async ({ body, set }) => {
    // 检查是否有文件
    if (!body.image) {
      set.status = 400
      return {
        success: false,
        message: '请选择要上传的图片'
      }
    }

    const file = body.image

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      set.status = 400
      return {
        success: false,
        message: '不支持的图片格式',
        allowed: ALLOWED_MIME_TYPES,
        received: file.type
      }
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      set.status = 400
      return {
        success: false,
        message: `图片大小超过限制 (最大 5MB)`,
        maxSize: MAX_FILE_SIZE,
        received: file.size
      }
    }

    // 生成文件 ID 和保存路径
    const fileId = `img_${Date.now()}_${++fileCounter}`
    const fileExt = file.name.split('.').pop() || 'jpg'
    const savedFilename = `${fileId}.${fileExt}`

    // 读取文件内容 (实际项目中应该保存到磁盘或云存储)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 模拟保存文件
    console.log(`保存文件：${savedFilename}, 大小：${buffer.length} bytes`)

    // 创建文件记录
    const fileRecord: UploadedFile = {
      id: fileId,
      filename: savedFilename,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      url: `/files/${fileId}`
    }

    files.set(fileId, fileRecord)

    return {
      success: true,
      message: '上传成功',
      data: fileRecord
    }
  }, {
    body: t.Object({
      image: t.File()
    })
  })

  // ========== 批量文件上传 ==========
  .post('/upload/batch', async ({ body, set }) => {
    // 确保上传了文件
    if (!body.images) {
      set.status = 400
      return {
        success: false,
        message: '请选择要上传的图片'
      }
    }

    // 标准化为数组
    const imageFiles = Array.isArray(body.images) ? body.images : [body.images]

    // 检查文件数量
    if (imageFiles.length > MAX_BATCH_SIZE) {
      set.status = 400
      return {
        success: false,
        message: `批量上传数量超过限制 (最多${MAX_BATCH_SIZE}张)`,
        maxBatchSize: MAX_BATCH_SIZE,
        received: imageFiles.length
      }
    }

    if (imageFiles.length === 0) {
      set.status = 400
      return {
        success: false,
        message: '至少需要上传一张图片'
      }
    }

    // 验证所有文件
    const errors: Array<{ index: number; message: string }> = []
    const validFiles: Array<{ file: any; index: number }> = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]

      // 验证文件类型
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push({
          index: i,
          message: `第${i + 1}张图片格式不支持：${file.type}`
        })
        continue
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          index: i,
          message: `第${i + 1}张图片超过大小限制 (最大 5MB)`
        })
        continue
      }

      validFiles.push({ file, index: i })
    }

    // 如果没有有效文件，返回错误
    if (validFiles.length === 0) {
      set.status = 400
      return {
        success: false,
        message: '没有有效的图片',
        errors
      }
    }

    // 处理有效文件
    const uploadedFiles: UploadedFile[] = []

    for (const { file } of validFiles) {
      const fileId = `img_${Date.now()}_${++fileCounter}`
      const fileExt = file.name.split('.').pop() || 'jpg'
      const savedFilename = `${fileId}.${fileExt}`

      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 创建文件记录
      const fileRecord: UploadedFile = {
        id: fileId,
        filename: savedFilename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: `/files/${fileId}`
      }

      files.set(fileId, fileRecord)
      uploadedFiles.push(fileRecord)

      console.log(`保存文件：${savedFilename}, 大小：${buffer.length} bytes`)
    }

    // 返回结果
    return {
      success: true,
      message: `成功上传 ${uploadedFiles.length} 张图片`,
      data: {
        uploaded: uploadedFiles,
        total: imageFiles.length,
        successCount: uploadedFiles.length,
        failedCount: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    }
  }, {
    body: t.Object({
      images: t.Union([
        t.File(),
        t.Array(t.File())
      ])
    })
  })

  // ========== 获取文件列表 ==========
  .get('/files', ({ query }) => {
    const allFiles = Array.from(files.values())

    // 按类型筛选
    let filteredFiles = allFiles
    if (query.type) {
      filteredFiles = allFiles.filter(f => f.mimetype.includes(query.type))
    }

    // 分页
    const page = query.page || 1
    const limit = query.limit || 20
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedFiles = filteredFiles.slice(start, end)

    // 统计信息
    const totalSize = filteredFiles.reduce((sum, f) => sum + f.size, 0)

    return {
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          page,
          limit,
          total: filteredFiles.length,
          totalPages: Math.ceil(filteredFiles.length / limit)
        },
        stats: {
          totalFiles: filteredFiles.length,
          totalSize,
          totalSizeFormatted: formatFileSize(totalSize)
        }
      }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.Number({ minimum: 1, default: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
      type: t.Optional(t.Union([
        t.Literal('jpeg'),
        t.Literal('png'),
        t.Literal('gif'),
        t.Literal('webp')
      ]))
    })
  })

  // ========== 获取单个文件信息 ==========
  .get('/files/:id', ({ params, set }) => {
    const file = files.get(params.id)

    if (!file) {
      set.status = 404
      return {
        success: false,
        message: '文件不存在'
      }
    }

    return {
      success: true,
      data: file
    }
  })

  // ========== 删除单个文件 ==========
  .delete('/files/:id', ({ params, set }) => {
    const deleted = files.delete(params.id)

    if (!deleted) {
      set.status = 404
      return {
        success: false,
        message: '文件不存在'
      }
    }

    return {
      success: true,
      message: '删除成功',
      data: {
        id: params.id
      }
    }
  })

  // ========== 批量删除文件 ==========
  .post('/files/batch-delete', ({ body }) => {
    const deletedIds: string[] = []
    const notFoundIds: string[] = []

    for (const id of body.ids) {
      if (files.delete(id)) {
        deletedIds.push(id)
      } else {
        notFoundIds.push(id)
      }
    }

    return {
      success: true,
      message: `删除了 ${deletedIds.length} 个文件`,
      data: {
        deleted: deletedIds,
        notFound: notFoundIds
      }
    }
  }, {
    body: t.Object({
      ids: t.Array(t.String())
    })
  })

  // ========== 获取上传统计 ==========
  .get('/stats', () => {
    const allFiles = Array.from(files.values())
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0)

    // 按类型统计
    const byType: Record<string, { count: number; size: number }> = {}
    for (const file of allFiles) {
      const type = file.mimetype.split('/')[1] || 'unknown'
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 }
      }
      byType[type].count++
      byType[type].size += file.size
    }

    // 最近上传
    const recentFiles = allFiles
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 10)

    return {
      success: true,
      data: {
        totalFiles: allFiles.length,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        byType: Object.entries(byType).map(([type, stats]) => ({
          type,
          count: stats.count,
          size: formatFileSize(stats.size)
        })),
        recentUploads: recentFiles
      }
    }
  })

  // ========== 文件上传配置信息 ==========
  .get('/upload/config', () => {
    return {
      success: true,
      data: {
        allowedTypes: ALLOWED_MIME_TYPES,
        maxFileSize: MAX_FILE_SIZE,
        maxFileSizeFormatted: formatFileSize(MAX_FILE_SIZE),
        maxBatchSize: MAX_BATCH_SIZE,
        uploadEndpoints: {
          single: 'POST /upload',
          batch: 'POST /upload/batch'
        }
      }
    }
  })

  // ========== 健康检查 ==========
  .get('/health', () => {
    const allFiles = Array.from(files.values())
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0)

    return {
      status: 'ok',
      uptime: process.uptime(),
      files: {
        total: allFiles.length,
        totalSize: formatFileSize(totalSize)
      },
      timestamp: new Date().toISOString()
    }
  })

  // ========== 使用示例 ==========
  .get('/', () => {
    return {
      message: '📷 Elysia 图片上传服务',
      version: '1.0.0',
      endpoints: {
        upload: {
          single: 'POST /upload - 单张图片上传',
          batch: 'POST /upload/batch - 批量图片上传 (最多10张)',
          config: 'GET /upload/config - 查看上传配置'
        },
        files: {
          list: 'GET /files - 获取文件列表',
          detail: 'GET /files/:id - 获取文件详情',
          delete: 'DELETE /files/:id - 删除文件',
          batchDelete: 'POST /files/batch-delete - 批量删除'
        },
        stats: 'GET /stats - 查看统计信息',
        health: 'GET /health - 健康检查'
      },
      tips: {
        allowedTypes: ALLOWED_MIME_TYPES,
        maxSize: formatFileSize(MAX_FILE_SIZE),
        maxBatch: MAX_BATCH_SIZE
      }
    }
  })

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

app.listen(3007, () => {
  console.log('🚀 图片上传服务运行在 http://localhost:3007')
  console.log('\n📷 上传接口:')
  console.log('   POST /upload           单张图片上传')
  console.log('   POST /upload/batch     批量图片上传 (最多 10 张)')
  console.log('   GET  /upload/config    查看上传配置')
  console.log('\n📁 文件管理:')
  console.log('   GET    /files          获取文件列表')
  console.log('   GET    /files/:id      获取文件详情')
  console.log('   DELETE /files/:id      删除单个文件')
  console.log('   POST   /files/batch-delete  批量删除')
  console.log('\n📊 统计信息:')
  console.log('   GET /stats             查看上传统计')
  console.log('\n💡 测试方法:')
  console.log('   使用 Postman 或 curl 测试上传')
  console.log('   或使用以下 HTML 表单测试:')
  console.log(`
<!-- 单张上传表单 -->
<form action="http://localhost:3007/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name="image" accept="image/*" required>
  <button type="submit">上传</button>
</form>

<!-- 批量上传表单 -->
<form action="http://localhost:3007/upload/batch" method="POST" enctype="multipart/form-data">
  <input type="file" name="images" accept="image/*" multiple required>
  <button type="submit">批量上传</button>
</form>
  `)
})
