/**
 * Level 3 - 练习案例: File Upload
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 独立完成完整项目
 * 2. ✅ 应用所学知识解决实际问题
 * 3. ✅ 练习代码组织和优化
 * 4. ✅ 培养调试能力
 * 
 * ⚠️ 注意事项：
 * - 先理解需求再 coding
 * - 参考已学案例的实现
 * - 遇到困难先查阅文档
 * - 完成後对比参考答案
 * 
 * 📝 练习任务：
 * - 完成所有功能
 * - 添加额外特性
 * - 编写测试用例
 * 
 * 🔗 相关文档：
 * - docs/00-README.md - 学习指南
 * - docs/00-INDEX.md - 文档导航
 * 
 * 运行：bun run <file>
 * 测试：http://localhost:<port>
 */

import { Elysia, t } from 'elysia'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'

// 文件元数据
interface FileMetadata {
  id: string
  userId: number
  originalName: string
  storedName: string
  mimeType: string
  size: number
  path: string
  uploadedAt: Date
  downloadCount: number
  tags: string[]
  description?: string
}

// 内存存储
const fileMetadata = new Map<string, FileMetadata>()

// 上传目录配置
const UPLOAD_DIR = '/tmp/elysia-uploads'
const USER_DIRS = new Map<number, string>()

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

// 获取用户目录
function getUserDir(userId: number): string {
  if (!USER_DIRS.has(userId)) {
    const userDir = join(UPLOAD_DIR, `user-${userId}`)
    if (!existsSync(userDir)) {
      mkdirSync(userDir, { recursive: true })
    }
    USER_DIRS.set(userId, userDir)
  }
  return USER_DIRS.get(userId)!
}

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.zip': 'application/zip'
}

// 允许的 MIME 类型
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip'
])

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

const app = new Elysia()
  .group('/files', app => app
    // POST /files/upload - 上传文件
    .post('/upload', async ({ request, body, query, set }) => {
      const contentType = request.headers.get('content-type')
      
      if (!contentType?.includes('multipart/form-data')) {
        set.status = 400
        return {
          success: false,
          error: 'Content-Type 必须是 multipart/form-data'
        }
      }

      const userId = Number(query.userId) || 1
      const tags = query.tags ? (Array.isArray(query.tags) ? query.tags : [query.tags]) : []
      const description = query.description

      // 获取用户目录
      const userDir = getUserDir(userId)

      // 解析 multipart 表单
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const fileTags = formData.get('tags')
      
      const fileTagsArray = fileTags 
        ? (typeof fileTags === 'string' ? fileTags.split(',').map(t => t.trim()) : [])
        : tags

      if (files.length === 0) {
        set.status = 400
        return {
          success: false,
          error: '没有文件上传'
        }
      }

      const uploadedFiles: FileMetadata[] = []
      const errors: string[] = []

      for (const file of files) {
        try {
          // 验证文件大小
          if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: 文件大小超过 10MB 限制`)
            continue
          }

          // 验证文件类型
          const ext = '.' + file.name.split('.').pop()?.toLowerCase()
          const mimeType = MIME_TYPES[ext] || file.type
          
          if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            errors.push(`${file.name}: 不支持的文件类型`)
            continue
          }

          // 生成唯一文件名
          const uuid = randomUUID()
          const storedName = `${uuid}${ext}`
          const filePath = join(userDir, storedName)

          // 读取文件内容并保存
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          writeFileSync(filePath, buffer)

          // 创建元数据
          const metadata: FileMetadata = {
            id: uuid,
            userId,
            originalName: file.name,
            storedName,
            mimeType,
            size: file.size,
            path: filePath,
            uploadedAt: new Date(),
            downloadCount: 0,
            tags: fileTagsArray,
            description
          }

          fileMetadata.set(uuid, metadata)
          uploadedFiles.push(metadata)
        } catch (error) {
          errors.push(`${file.name}: 上传失败 - ${error}`)
        }
      }

      if (uploadedFiles.length === 0) {
        set.status = 400
        return {
          success: false,
          error: '所有文件上传失败',
          errors
        }
      }

      return {
        success: true,
        message: `成功上传 ${uploadedFiles.length} 个文件`,
        data: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    })

    // GET /files - 获取文件列表
    .get('/', ({ query, set }) => {
      const userId = query.userId ? Number(query.userId) : null
      const tags = query.tags
      const mimeType = query.mimeType

      let files = Array.from(fileMetadata.values())

      // 按用户筛选
      if (userId) {
        files = files.filter(f => f.userId === userId)
      }

      // 按标签筛选
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags]
        files = files.filter(f => f.tags.some(t => tagArray.includes(t)))
      }

      // 按 MIME 类型筛选
      if (mimeType) {
        files = files.filter(f => f.mimeType.startsWith(mimeType as string))
      }

      // 按时间排序 (最新的在前)
      files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())

      return {
        success: true,
        count: files.length,
        data: files.map(f => ({
          ...f,
          fileSize: `${(f.size / 1024).toFixed(2)} KB`
        }))
      }
    })

    // GET /files/:id - 获取文件信息
    .get('/:id', ({ params, set }) => {
      const file = fileMetadata.get(params.id)
      
      if (!file) {
        set.status = 404
        return {
          success: false,
          error: '文件不存在'
        }
      }

      // 检查文件是否物理存在
      if (!existsSync(file.path)) {
        set.status = 404
        return {
          success: false,
          error: '文件已被删除'
        }
      }

      return {
        success: true,
        data: {
          ...file,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          uploadedAt: file.uploadedAt.toISOString()
        }
      }
    })

    // GET /files/:id/download - 下载文件
    .get('/:id/download', ({ params, set }) => {
      const file = fileMetadata.get(params.id)
      
      if (!file) {
        set.status = 404
        return {
          success: false,
          error: '文件不存在'
        }
      }

      if (!existsSync(file.path)) {
        set.status = 404
        return {
          success: false,
          error: '文件不存在'
        }
      }

      // 增加下载次数
      file.downloadCount++
      fileMetadata.set(params.id, file)

      // 返回文件
      const fileBuffer = readFileSync(file.path)
      set.headers['Content-Type'] = file.mimeType
      set.headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(file.originalName)}"`
      set.headers['Content-Length'] = file.size.toString()

      return fileBuffer
    })

    // DELETE /files/:id - 删除文件
    .delete('/:id', ({ params, set }) => {
      const file = fileMetadata.get(params.id)
      
      if (!file) {
        set.status = 404
        return {
          success: false,
          error: '文件不存在'
        }
      }

      try {
        // 删除物理文件
        if (existsSync(file.path)) {
          unlinkSync(file.path)
        }

        // 删除元数据
        fileMetadata.delete(params.id)

        return {
          success: true,
          message: '文件删除成功'
        }
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: `删除失败：${error}`
        }
      }
    })

    // PUT /files/:id/tags - 更新文件标签
    .put('/:id/tags', ({ params, body, set }) => {
      const file = fileMetadata.get(params.id)
      
      if (!file) {
        set.status = 404
        return {
          success: false,
          error: '文件不存在'
        }
      }

      const { tags } = body
      
      if (!Array.isArray(tags)) {
        set.status = 400
        return {
          success: false,
          error: '标签必须是数组'
        }
      }

      file.tags = tags
      fileMetadata.set(params.id, file)

      return {
        success: true,
        message: '标签更新成功',
        data: file
      }
    })
  )

  // GET /files/stats - 获取文件统计
  .get('/files/stats', ({ query }) => {
    const userId = query.userId ? Number(query.userId) : null
    
    let files = Array.from(fileMetadata.values())
    if (userId) {
      files = files.filter(f => f.userId === userId)
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const byType: Record<string, number> = {}
    const byUser: Record<number, number> = {}

    files.forEach(f => {
      const type = f.mimeType.split('/')[0]
      byType[type] = (byType[type] || 0) + 1
      byUser[f.userId] = (byUser[f.userId] || 0) + 1
    })

    return {
      success: true,
      stats: {
        totalFiles: files.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        averageSize: files.length > 0 ? `${(totalSize / files.length / 1024).toFixed(2)} KB` : '0 KB',
        byType,
        byUser: Object.fromEntries(
          Object.entries(byUser).map(([k, v]) => [`user-${k}`, v])
        ),
        mostDownloaded: files
          .sort((a, b) => b.downloadCount - a.downloadCount)
          .slice(0, 5)
          .map(f => ({
            name: f.originalName,
            downloads: f.downloadCount
          }))
      }
    }
  })

  // POST /files/cleanup - 清理临时文件 (管理功能)
  .post('/files/cleanup', () => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 小时
    let cleaned = 0

    for (const [id, file] of fileMetadata.entries()) {
      if (now - file.uploadedAt.getTime() > maxAge) {
        if (existsSync(file.path)) {
          unlinkSync(file.path)
        }
        fileMetadata.delete(id)
        cleaned++
      }
    }

    return {
      success: true,
      message: `清理了 ${cleaned} 个过期文件`
    }
  })

  .listen(3007)

console.log('📁 文件上传服务运行在 http://localhost:3007')
console.log('📖 测试端点:')
console.log('   POST   /files/upload?userId=1&tags=文档 - 上传文件')
console.log('   GET    /files - 获取文件列表')
console.log('   GET    /files?userId=1 - 按用户筛选')
console.log('   GET    /files/:id - 获取文件信息')
console.log('   GET    /files/:id/download - 下载文件')
console.log('   DELETE /files/:id - 删除文件')
console.log('   PUT    /files/:id/tags - 更新标签')
console.log('   GET    /files/stats - 获取统计信息')
console.log('💡 测试上传:')
console.log('   curl -X POST http://localhost:3007/files/upload?userId=1 -F "files=@test.jpg"')

// 需要引入 readFileSync
import { readFileSync as _readFileSync } from 'fs'
const readFileSync = _readFileSync

export type FileUploadApp = typeof app
