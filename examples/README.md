# Examples 迷你案例库

每个案例聚焦一个知识点，代码量少，可独立运行，5-10 分钟完成。

---

## 使用方法

```bash
# 运行任意案例
npx tsx examples/01-router/basic-router.ts

# 监听模式运行
npx tsx watch examples/01-router/basic-router.ts
```

---

## 案例列表

### 01 - 路由专题

| 案例 | 文件 | 知识点 | 预计时间 |
|------|------|--------|----------|
| 基础路由 | `01-router/basic-router.ts` | GET/POST 路由定义 | 5 分钟 |
| 路径参数 | `01-router/path-params.ts` | :id 参数获取 | 5 分钟 |
| 查询参数 | `01-router/query-params.ts` | ?key=value参数 | 5 分钟 |
| 路由组 | `01-router/route-groups.ts` | 路由分组和前缀 | 10 分钟 |

### 02 - 验证专题

| 案例 | 文件 | 知识点 | 预计时间 |
|------|------|--------|----------|
| 字符串验证 | `02-validation/string-validation.ts` | minLength/maxLength | 5 分钟 |
| 数字验证 | `02-validation/number-validation.ts` | minimum/maximum | 5 分钟 |
| 对象验证 | `02-validation/object-validation.ts` | 嵌套对象验证 | 10 分钟 |
| 自定义验证 | `02-validation/custom-validation.ts` | 自定义验证规则 | 10 分钟 |

### 03 - 中间件专题

| 案例 | 文件 | 知识点 | 预计时间 |
|------|------|--------|----------|
| 日志中间件 | `03-middleware/logger.ts` | 请求日志记录 | 5 分钟 |
| 认证中间件 | `03-middleware/auth.ts` | Token 验证 | 10 分钟 |
| CORS 中间件 | `03-middleware/cors.ts` | 跨域配置 | 5 分钟 |
| 限流中间件 | `03-middleware/ratelimit.ts` | 请求频率限制 | 10 分钟 |

### 04 - 响应专题

| 案例 | 文件 | 知识点 | 预计时间 |
|------|------|--------|----------|
| JSON 响应 | `04-response/json-response.ts` | 标准 JSON 响应 | 5 分钟 |
| 文件响应 | `04-response/file-response.ts` | 文件下载 | 10 分钟 |
| 流式响应 | `04-response/stream-response.ts` | 流式数据传输 | 10 分钟 |
| 错误响应 | `04-response/error-response.ts` | 统一错误格式 | 10 分钟 |

### 05 - 插件专题

| 案例 | 文件 | 知识点 | 预计时间 |
|------|------|--------|----------|
| Swagger 文档 | `05-plugins/swagger.ts` | API 文档生成 | 10 分钟 |
| JWT 插件 | `05-plugins/jwt.ts` | JWT 认证 | 15 分钟 |
| 静态文件 | `05-plugins/static.ts` | 静态资源服务 | 10 分钟 |

---

## 学习建议

1. **按顺序学习** - 从 01-router 开始
2. **动手实践** - 每个案例都要运行并修改
3. **理解原理** - 不要只是复制代码
4. **举一反三** - 尝试修改案例添加新功能

---

祝学习愉快！
