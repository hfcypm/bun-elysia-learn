# 📷 图片上传功能说明

## 新增案例：批量图片上传服务

在 `src/intermediate/05-file-upload.ts` 中添加了完整的图片上传功能。

---

## 🚀 快速启动

```bash
# 方式 1: 使用启动脚本
./start.sh  # 选择选项 8

# 方式 2: 使用 npm 命令
npm run dev:example4

# 方式 3: 直接运行
npx tsx src/intermediate/05-file-upload.ts
```

服务启动在：**http://localhost:3007**

---

## 📋 功能列表

### 上传接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/upload` | POST | 单张图片上传 |
| `/upload/batch` | POST | 批量图片上传（最多 10 张） |
| `/upload/config` | GET | 查看上传配置信息 |

### 文件管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/files` | GET | 获取文件列表（支持分页和筛选） |
| `/files/:id` | GET | 获取单个文件详情 |
| `/files/:id` | DELETE | 删除单个文件 |
| `/files/batch-delete` | POST | 批量删除文件 |

### 统计信息

| 接口 | 方法 | 描述 |
|------|------|------|
| `/stats` | GET | 获取上传统计信息 |
| `/health` | GET | 服务健康检查 |

---

## 🔧 配置参数

### 允许的文件类型

- `image/jpeg` - JPEG 图片
- `image/png` - PNG 图片
- `image/gif` - GIF 图片
- `image/webp` - WebP 图片

### 限制

- **单文件大小**: 最大 5MB
- **批量上传**: 最多 10 张图片
- **分页**: 每页最多 100 个文件

---

## 📝 使用示例

### 1. 单张图片上传

**使用 curl:**

```bash
curl -X POST http://localhost:3007/upload \
  -F "image=@/path/to/your/image.jpg"
```

**使用 FormData (浏览器):**

```html
<form action="http://localhost:3007/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name="image" accept="image/*" required>
  <button type="submit">上传</button>
</form>
```

**使用 JavaScript:**

```javascript
const fileInput = document.getElementById('imageInput');
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3007/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

---

### 2. 批量图片上传

**使用 curl:**

```bash
curl -X POST http://localhost:3007/upload/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  -F "images=@image3.gif"
```

**使用 FormData (浏览器):**

```javascript
const fileInput = document.getElementById('batchInput');
const formData = new FormData();

// 添加多个文件
for (let i = 0; i < fileInput.files.length; i++) {
  formData.append('images', fileInput.files[i]);
}

const response = await fetch('http://localhost:3007/upload/batch', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

---

### 3. 获取文件列表

**查询所有文件:**

```bash
curl http://localhost:3007/files
```

**分页查询:**

```bash
curl "http://localhost:3007/files?page=1&limit=20"
```

**按类型筛选:**

```bash
curl "http://localhost:3007/files?type=png"
```

---

### 4. 删除文件

**删除单个文件:**

```bash
curl -X DELETE http://localhost:3007/files/img_123456_1
```

**批量删除:**

```bash
curl -X POST http://localhost:3007/files/batch-delete \
  -H "Content-Type: application/json" \
  -d '{"ids": ["img_123456_1", "img_123456_2"]}'
```

---

## 🎨 测试页面

提供了一个完整的 HTML 测试页面，可以直接在浏览器中使用：

```bash
# 在浏览器中打开
open docs/upload-test.html

# 或者使用任意 HTTP 服务器
npx serve docs
```

测试页面功能：
- ✅ 单张图片上传
- ✅ 批量图片上传
- ✅ 图片预览
- ✅ 文件列表展示
- ✅ 统计信息显示
- ✅ 实时上传进度

---

## 📊 响应格式

### 成功响应

```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "id": "img_1685432100_1",
    "filename": "img_1685432100_1.jpg",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 1024567,
    "uploadedAt": "2026-05-29T12:34:56.789Z",
    "url": "/files/img_1685432100_1"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "不支持的图片格式",
  "allowed": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "received": "application/pdf"
}
```

### 批量上传响应

```json
{
  "success": true,
  "message": "成功上传 5 张图片",
  "data": {
    "uploaded": [
      {
        "id": "img_1685432100_1",
        "filename": "img_1685432100_1.jpg",
        "originalName": "photo1.jpg",
        "mimetype": "image/jpeg",
        "size": 1024567,
        "uploadedAt": "2026-05-29T12:34:56.789Z",
        "url": "/files/img_1685432100_1"
      }
    ],
    "total": 5,
    "successCount": 5,
    "failedCount": 0
  },
  "errors": []
}
```

---

## 🔍 知识点

通过这个案例，你将学习到：

1. **单文件上传处理**
   - FormData 解析
   - 文件类型验证
   - 文件大小限制

2. **批量文件上传**
   - 数組文件处理
   - 部分成功处理
   - 错误收集

3. **文件验证**
   - MIME 类型检查
   - 大小验证
   - 数量限制

4. **文件管理**
   - 文件列表分页
   - 文件筛选
   - 批量删除

5. **统计功能**
   - 数据聚合
   - 分类统计
   - 格式化显示

---

## 💡 最佳实践

### 1. 文件命名

```typescript
// 使用时间戳 + 计数器生成唯一 ID
const fileId = `img_${Date.now()}_${++fileCounter}`
```

### 2. 错误处理

```typescript
// 批量上传时收集所有错误，而不是遇到第一个错误就停止
const errors: Array<{ index: number; message: string }> = []
for (const file of files) {
  if (!validate(file)) {
    errors.push({ index, message: '验证失败' })
    continue
  }
  // 处理有效文件
}
```

### 3. 资源清理

```typescript
// 实际项目中应该实现文件清理机制
// 例如：定时清理过期文件、删除文件时同时删除磁盘文件
```

---

## 🚧 扩展建议

如果需要用于生产环境，建议添加：

1. **文件存储**
   - 本地磁盘存储
   - 云存储集成（AWS S3、阿里云 OSS）
   - CDN 加速

2. **安全增强**
   - 图片内容验证（防止恶意文件）
   - 上传频率限制
   - 用户配额管理

3. **图片处理**
   - 缩略图生成
   - 图片压缩
   - 水印添加

4. **元数据**
   - EXIF 信息提取
   - 图片尺寸检测
   - 颜色分析

---

## 📖 相关文档

- [Postman Collection](elysia-learning.postman_collection.json) - Level 2 文件上传部分
- [测试页面](upload-test.html) - 浏览器测试界面
- [快速参考](QUICK_REFERENCE.md) - 文件上传相关 API

---

祝你使用愉快！🎉
