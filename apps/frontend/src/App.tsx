/**
 * 文件上传测试组件
 * 使用 Tailwind CSS 样式
 * 
 * @packageDocumentation
 * 
 * 功能说明:
 * - 单文件上传：支持选择并上传单个图片文件
 * - 批量上传：支持一次上传最多 10 个图片文件
 * - 实时预览：上传前显示图片预览
 * - 文件列表：展示所有已上传的文件
 * - 文件管理：支持删除已上传的文件
 * 
 * 后端 API:
 * - POST /upload - 单文件上传
 * - POST /upload/batch - 批量上传
 * - GET /files - 获取文件列表
 * - DELETE /files/:id - 删除文件
 * - GET /static/uploads/:filename - 访问上传的文件
 * 
 * @see http://localhost:3000 前端访问地址
 * @see http://localhost:3001 后端 API 地址
 */

import { useState, useRef, useEffect } from 'react'

/**
 * 文件数据结构接口
 */
interface FileData {
  /** 文件唯一标识符 */
  id: string
  /** 存储的文件名 */
  filename: string
  /** 原始文件名 */
  originalName: string
  /** 文件 MIME 类型 */
  mimetype: string
  /** 文件大小（字节） */
  size: number
  /** 上传时间 */
  uploadedAt: string
  /** 文件访问 URL */
  url: string
  /** 文件服务器路径 */
  path: string
}

/**
 * 上传响应数据结构接口
 */
interface UploadResponse {
  /** 是否成功 */
  success: boolean
  /** 响应消息 */
  message: string
  /** 上传数据 */
  data?: FileData | { uploaded: FileData[] }
  /** 错误信息 */
  errors?: Array<{ index: number; message: string }>
}

/**
 * 文件上传测试主组件
 */
function FileUploadTest() {
  // ==================== Refs 定义 ====================
  
  /** 单文件输入引用 */
  const fileInputRef = useRef<HTMLInputElement>(null)
  /** 批量文件输入引用 */
  const batchFileInputRef = useRef<HTMLInputElement>(null)
  
  // ==================== State 状态管理 ====================
  
  /** 选中的单个文件 */
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  /** 选中的批量文件 */
  const [selectedBatchFiles, setSelectedBatchFiles] = useState<File[]>([])
  /** 文件列表 */
  const [fileList, setFileList] = useState<FileData[]>([])
  /** 预览 URL */
  const [previewUrl, setPreviewUrl] = useState<string>('')
  /** 加载状态 */
  const [loading, setLoading] = useState(false)
  /** 上传结果 */
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  /** 错误消息 */
  const [error, setError] = useState('')

  // ==================== 工具函数 ====================
  
  /**
   * 格式化文件大小
   */
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  // ==================== 文件选择处理 ====================
  
  /** 触发单文件选择 */
  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  /** 处理单文件变更 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError('')
      setUploadResult(null)
    }
  }

  /** 触发批量文件选择 */
  const handleSelectBatchFiles = () => {
    batchFileInputRef.current?.click()
  }

  /** 处理批量文件变更 */
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      setSelectedBatchFiles(files)
      setError('')
      setUploadResult(null)
    }
  }

  // ==================== 文件上传处理 ====================
  
  /** 处理单文件上传 */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请选择要上传的文件')
      return
    }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setUploadResult(data)
      
      if (data.success) {
        setSelectedFile(null)
        setPreviewUrl('')
        fetchFileList()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('上传失败：' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  /** 处理批量上传 */
  const handleBatchUpload = async () => {
    if (selectedBatchFiles.length === 0) {
      setError('请选择要上传的文件')
      return
    }

    if (selectedBatchFiles.length > 10) {
      setError('最多只能批量上传 10 个文件')
      return
    }

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    selectedBatchFiles.forEach(file => formData.append('images', file))

    try {
      const res = await fetch('/upload/batch', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setUploadResult(data)
      
      if (data.success) {
        setSelectedBatchFiles([])
        fetchFileList()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('上传失败：' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== 文件列表管理 ====================
  
  /** 获取文件列表 */
  const fetchFileList = async () => {
    try {
      const res = await fetch('/files')
      const data = await res.json()
      if (data.success) {
        setFileList(data.data.files)
      }
    } catch (err) {
      console.error('获取文件列表失败:', err)
    }
  }

  /**
   * 删除文件
   */
  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
      return
    }

    try {
      const res = await fetch(`/files/${fileId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (data.success) {
        setFileList(fileList.filter(f => f.id !== fileId))
        setUploadResult({
          success: true,
          message: `已删除文件：${filename}`
        })
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('删除失败：' + (err as Error).message)
    }
  }

  // ==================== 生命周期钩子 ====================
  
  /** 组件挂载时加载文件列表 */
  useEffect(() => {
    fetchFileList()
  }, [])

  // ==================== 渲染 JSX ====================
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📷 文件上传测试
          </h1>
          <p className="text-gray-600">
            后端服务：http://localhost:3001 | 前端：http://localhost:3000
          </p>
        </div>

        {/* 上传限制说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">📋 上传限制</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 支持的格式：JPEG, PNG, GIF, WebP</li>
            <li>• 单文件大小：最大 5MB</li>
            <li>• 批量上传：最多 10 个文件</li>
          </ul>
        </div>

        {/* 单文件上传区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📄 单文件上传</h2>

          <div className="space-y-4">
            {/* 隐藏的文件输入框 */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="flex gap-4">
              <button onClick={handleSelectFile} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                📁 选择文件
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  !selectedFile || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? '上传中...' : '⬆️ 上传'}
              </button>
            </div>

            {/* 图片预览 area */}
            {previewUrl && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">预览：</p>
                <img src={previewUrl} alt="预览" className="max-w-sm max-h-64 rounded-lg shadow-sm" />
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>文件名：<span className="font-mono">{selectedFile?.name}</span></p>
                  <p>大小：<span className="font-mono">{formatSize(selectedFile?.size || 0)}</span></p>
                  <p>类型：<span className="font-mono">{selectedFile?.type}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 批量上传区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📦 批量上传 <span className="text-sm font-normal text-gray-500 ml-2">(最多 10 个文件)</span>
          </h2>

          <div className="space-y-4">
            {/* 隐藏的文件输入框（多选） */}
            <input ref={batchFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBatchFileChange} />

            <div className="flex gap-4">
              <button onClick={handleSelectBatchFiles} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                📁 选择多个文件
              </button>
              <button
                onClick={handleBatchUpload}
                disabled={selectedBatchFiles.length === 0 || loading}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  selectedBatchFiles.length === 0 || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? '上传中...' : '⬆️ 批量上传'}
              </button>
            </div>

            {/* 已选文件列表 */}
            {selectedBatchFiles.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">已选择 {selectedBatchFiles.length} 个文件：</p>
                <ul className="space-y-1">
                  {selectedBatchFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600 flex justify-between">
                      <span className="font-mono">{file.name}</span>
                      <span>{formatSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 错误提示框 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">❌ {error}</div>
        )}

        {/* 上传结果显示 */}
        {uploadResult && (
          <div className={`rounded-lg p-4 mb-6 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
              {uploadResult.success ? '✅ ' : '❌ '}
              {uploadResult.message}
            </p>
            {'data' in uploadResult && uploadResult.data && 'uploaded' in uploadResult.data && (
              <p className="text-sm text-green-800 mt-2">成功上传 {uploadResult.data.uploaded.length} 个文件</p>
            )}
          </div>
        )}

        {/* 已上传文件列表 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📋 已上传文件</h2>
            <button onClick={fetchFileList} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              🔄 刷新
            </button>
          </div>

          {/* 空状态或文件列表 */}
          {fileList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无文件，点击上方按钮上传</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fileList.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* 文件预览图 */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">无预览</text></svg>'
                      }}
                    />
                  </div>
                  {/* 文件信息 */}
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900 truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-gray-500">{formatSize(file.size)}</p>
                    <p className="text-gray-500 text-xs">{file.mimetype.split('/')[1]?.toUpperCase()}</p>
                    <p className="text-gray-400 text-xs">{formatDate(file.uploadedAt)}</p>
                  </div>
                  {/* 操作按钮 */}
                  <div className="mt-3 flex gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-center"
                    >
                      🔗 查看
                    </a>
                    <button
                      onClick={() => handleDelete(file.id, file.originalName)}
                      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          {fileList.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">共 {fileList.length} 个文件</p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 提示：上传的文件保存在 /workspace/uploads/ 目录</p>
        </div>
      </div>
    </div>
  )
}

export default FileUploadTest
