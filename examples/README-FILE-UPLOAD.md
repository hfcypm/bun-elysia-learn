# 📷 文件上传测试指南

## 🚀 快速开始

### 1. 启动后端服务

```bash
bun run src/02-intermediate/05-file-upload.ts
```

服务将运行在 `http://localhost:3007`

### 2. 选择测试方式

#### 方式 A: React 组件

**适用场景**: 已有 React + Tailwind CSS 项目

**文件位置**: `examples/file-upload-test.tsx`

**使用步骤**:

1. 复制组件到你的 React 项目
2. 确保已安装 Tailwind CSS
3. 在页面中引入并使用

```tsx
import FileUploadTest from './FileUploadTest'

function App() {
  return <FileUploadTest />
}
```

**依赖**:
- React 18+
- Tailwind CSS

---

#### 方式 B: 独立 HTML 页面

**适用场景**: 快速测试，无需构建工具

**文件位置**: `examples/file-upload-test.html`

**使用步骤**:

1. 直接用浏览器打开 HTML 文件
2. 或使用本地服务器

```bash
# 使用 Python
cd examples
python3 -m http.server 8080

# 使用 Node.js
npx serve examples

# 使用 Bun
bun run --hot examples/file-upload-test.html
```

3. 访问 `http://localhost:8080/file-upload-test.html`

**特点**:
- ✅ 使用 Tailwind CSS CDN
- ✅ 无需安装依赖
- ✅ 双击即可打开

---

## 📋 功能列表

| 功能 | 说明 |
|------|------|
| ✅ 单文件上传 | 选择并上传单个图片 |
| ✅ 批量上传 | 最多 10 个文件 |
| ✅ 实时预览 | 上传前预览图片 |
| ✅ 文件列表 | 显示所有已上传文件 |
| ✅ 文件预览 | 网格展示 + 缩略图 |
| ✅ 文件详情 | 名称、大小、类型、日期 |
| ✅ 删除功能 | 单个删除 + 确认 |
| ✅ 自动刷新 | 上传/删除后自动更新列表 |
| ✅ 错误提示 | 友好的错误消息 |
| ✅ 状态反馈 | 上传中/成功/失败提示 |

---

## 🔧 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/upload` | POST | 单文件上传 |
| `/upload/batch` | POST | 批量上传 |
| `/files` | GET | 获取文件列表 |
| `/files/:id` | GET | 获取文件详情 |
| `/files/:id` | DELETE | 删除文件 |
| `/files/batch-delete` | POST | 批量删除 |
| `/static/uploads/:filename` | GET | 访问上传的文件 |
| `/upload/config` | GET | 获取上传配置 |
| `/stats` | GET | 查看统计信息 |

---

## 📁 文件存储

**保存位置**: `/workspace/uploads/`

**文件命名**: `img_时间戳_序号。扩展名`

**示例**:
```
/workspace/uploads/
├── img_1781222875962_1.jpg
├── img_1781222944182_2.png
└── img_1781222944183_3.gif
```

**访问 URL**: `http://localhost:3007/static/uploads/文件名`

---

## ⚠️ 限制说明

| 限制类型 | 值 |
|---------|-----|
| 支持格式 | JPEG, PNG, GIF, WebP |
| 单文件大小 | 最大 5MB |
| 批量上传 | 最多 10 个文件 |
| 存储位置 | 本地磁盘（非内存） |

---

## 🧪 测试用例

### 测试单文件上传

```bash
curl -X POST http://localhost:3007/upload \
  -F "image=@/path/to/image.jpg"
```

### 测试批量上传

```bash
curl -X POST http://localhost:3007/upload/batch \
  -F "images=@file1.jpg" \
  -F "images=@file2.png" \
  -F "images=@file3.gif"
```

### 测试文件访问

```bash
curl http://localhost:3007/static/uploads/img_xxx.jpg
```

### 测试删除

```bash
curl -X DELETE http://localhost:3007/files/img_xxx
```

---

## 🎨 Tailwind CSS 样式说明

**React 组件**使用标准 Tailwind 类：

- `bg-indigo-600` - 主按钮颜色
- `bg-green-600` - 成功/可用状态
- `bg-red-600` - 删除/错误状态
- `bg-gray-300` - 禁用状态
- `rounded-lg` - 圆角卡片
- `shadow-md` - 阴影效果
- `grid grid-cols-3` - 响应式网格布局

**修改主题色**：全局搜索替换颜色类即可

---

## 🐛 常见问题

### 1. 上传失败 "网络连接错误"

**原因**: 后端服务未启动

**解决**: 
```bash
bun run src/02-intermediate/05-file-upload.ts
```

### 2. 跨域错误 (CORS)

**原因**: 前端和后端不在同一端口

**解决**: 后端已启用 CORS，检查服务是否正常启动

### 3. 文件无法预览

**原因**: 图片格式不支持或文件损坏

**解决**: 使用 JPEG/PNG/GIF/WebP 格式的正常图片

### 4. 上传后文件列表未更新

**原因**: 自动刷新失败

**解决**: 点击"🔄 刷新"按钮手动刷新

---

## 📊 性能优化建议

1. **图片压缩**: 上传前在客户端压缩图片
2. **懒加载**: 文件列表分页加载
3. **缓存**: 缓存已加载的缩略图
4. **进度条**: 添加上传进度显示

---

## 🔗 相关文件

- `src/02-intermediate/05-file-upload.ts` - 后端服务
- `examples/file-upload-test.tsx` - React 组件
- `examples/file-upload-test.html` - 独立 HTML 页面
- `uploads/` - 上传文件存储目录

---

## 💡 下一步

- [ ] 添加拖拽上传功能
- [ ] 添加上传进度条
- [ ] 支持文件夹上传
- [ ] 添加图片编辑功能
- [ ] 集成到主项目

---

**最后更新**: 2026-06-12  
**作者**: AI Assistant
