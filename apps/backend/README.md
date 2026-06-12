## 🚀 Backend Server

文件上传服务后端，基于 Elysia + Bun。

### 📦 安装

```bash
cd apps/backend
bun install
```

### 🏃 运行

```bash
# 开发模式（热重载）
bun run dev

# 生产模式
bun run start
```

### 🔧 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/upload` | POST | 单文件上传 |
| `/upload/batch` | POST | 批量上传 |
| `/files` | GET | 文件列表 |
| `/files/:id` | GET | 文件详情 |
| `/files/:id` | DELETE | 删除文件 |
| `/files/batch-delete` | POST | 批量删除 |
| `/static/uploads/:filename` | GET | 访问上传的文件 |
| `/upload/config` | GET | 上传配置 |
| `/stats` | GET | 统计信息 |
| `/health` | GET | 健康检查 |

### 📁 文件存储

- **位置**: `../../uploads/` (项目根目录)
- **限制**: 
  - 支持格式：JPEG, PNG, GIF, WebP
  - 单文件最大：5MB
  - 批量最多：10 个文件

### 🧪 测试

```bash
# 单元测试
bun test

# 测试上传
curl -X POST http://localhost:3001/upload \
  -F "image=@test.jpg"
```

### 📝 相关文档

- [API 文档](../../docs/07-file_upload_guide.md)
- [使用示例](../../examples/05-file-upload.ts)
