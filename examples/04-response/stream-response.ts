/**
 * 示例片段: Stream Response
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 学习不同类型的响应
 * 2. ✅ 理解响应格式的控制
 * 3. ✅ 根据需要选择合适的类型
 * 4. ✅ 优化响应性能
 * 
 * ⚠️ 注意事项：
 * - 默认端口 3008，被占用请修改
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
 * 运行：bun run examples/04-response/stream-response.ts
 * 测试：http://localhost:3008
 */

import { Elysia, t } from 'elysia'

// 模拟异步数据流
async function* generateDataStream(count: number) {
  for (let i = 1; i <= count; i++) {
    yield {
      step: i,
      message: `处理第 ${i} 项`,
      progress: Math.round((i / count) * 100),
      timestamp: new Date().toISOString()
    }
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// 模拟 SSE 事件流
async function* generateSSEStream(duration: number, interval: number) {
  const startTime = Date.now()
  let eventId = 0

  while (Date.now() - startTime < duration) {
    eventId++
    yield {
      event: 'update',
      id: eventId,
      data: {
        timestamp: new Date().toISOString(),
        value: Math.random() * 100,
        status: ['running', 'processing', 'checking'][Math.floor(Math.random() * 3)]
      }
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  // 结束事件
  yield {
    event: 'complete',
    id: eventId + 1,
    data: {
      message: '流式传输完成',
      duration: Date.now() - startTime
    }
  }
}

const app = new Elysia()
  // ==================== 流式 JSON 响应 ====================
  .get('/stream/json/:count', async ({ params, set }) => {
    const count = Math.min(parseInt(params.count) || 10, 100)
    
    // 设置流式响应头
    set.headers['Content-Type'] = 'application/x-ndjson'
    set.headers['Transfer-Encoding'] = 'chunked'
    set.headers['Cache-Control'] = 'no-cache'

    // 创建 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          for await (const chunk of generateDataStream(count)) {
            // 每行一个 JSON 对象 (Newline Delimited JSON)
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'))
          }
        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: '流式传输失败' }) + '\n'))
        } finally {
          controller.close()
        }
      }
    })

    return stream
  })

  // ==================== Server-Sent Events ====================
  .get('/stream/sse', async ({ query, set }) => {
    const duration = Number(query.duration) || 10000 // 默认 10 秒
    const interval = Number(query.interval) || 1000  // 默认 1 秒

    // 设置 SSE 响应头
    set.headers['Content-Type'] = 'text/event-stream'
    set.headers['Cache-Control'] = 'no-cache'
    set.headers['Connection'] = 'keep-alive'
    set.headers['Access-Control-Allow-Origin'] = '*'

    // 创建 SSE 流
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          for await (const event of generateSSEStream(duration, interval)) {
            // SSE 格式: event: {event_name}\ndata: {data}\nid: {id}\n\n
            const sseMessage = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\nid: ${event.id}\n\n`
            controller.enqueue(encoder.encode(sseMessage))
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: '流式传输失败' })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return stream
  })

  // ==================== 简单 SSE (计数器示例) ====================
  .get('/stream/counter', async ({ set }) => {
    set.headers['Content-Type'] = 'text/event-stream'
    set.headers['Cache-Control'] = 'no-cache'
    set.headers['Connection'] = 'keep-alive'

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let count = 0

        const interval = setInterval(() => {
          count++
          const message = `data: ${count}\n\n`
          controller.enqueue(encoder.encode(message))

          if (count >= 10) {
            clearInterval(interval)
            controller.close()
          }
        }, 1000)

        // 清理定时器
        stream.cancel = () => clearInterval(interval)
      }
    })

    return stream
  })

  // ==================== 进度报告流 ====================
  .get('/stream/progress/:taskId', async ({ params, set }) => {
    const taskId = params.taskId

    set.headers['Content-Type'] = 'text/event-stream'
    set.headers['Cache-Control'] = 'no-cache'
    set.headers['Connection'] = 'keep-alive'

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        // 模拟任务执行的各个阶段
        const stages = [
          { name: '初始化', duration: 500 },
          { name: '数据加载', duration: 1000 },
          { name: '数据处理', duration: 1500 },
          { name: '结果验证', duration: 500 },
          { name: '完成', duration: 0 }
        ]

        let totalProgress = 0
        const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0)

        try {
          for (const stage of stages) {
            const progress = Math.round((totalProgress / totalDuration) * 100)
            
            const message = {
              taskId,
              stage: stage.name,
              progress,
              timestamp: new Date().toISOString()
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
            
            if (stage.duration > 0) {
              await new Promise(resolve => setTimeout(resolve, stage.duration))
            }
            totalProgress += stage.duration
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', taskId })}\n\n`))
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', error, taskId })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return stream
  })

  // ==================== 模拟长时间运行的任务 ====================
  .post('/tasks/long-running', async ({ body, set }) => {
    const { duration = 5000, steps = 5 } = body
    const taskId = `task-${Date.now()}`

    // 返回任务 ID，客户端可以通过 taskId 订阅进度
    return {
      success: true,
      taskId,
      message: '任务已创建，请通过 /stream/progress/:taskId 查看进度',
      estimatedDuration: duration
    }
  })

  // ==================== HTML 测试页面 ====================
  .get('/stream/test', () => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>流式响应测试</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; }
    .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    h2 { color: #333; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; }
    button:hover { background: #0056b3; }
    button:disabled { background: #ccc; }
    .output { background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 300px; overflow-y: auto; font-family: monospace; white-space: pre-wrap; }
    .event { margin: 5px 0; padding: 5px; background: white; border-left: 3px solid #007bff; }
    .event.error { border-left-color: #dc3545; }
    .event.complete { border-left-color: #28a745; }
  </style>
</head>
<body>
  <h1>🌊 流式响应与 SSE 测试</h1>

  <div class="section">
    <h2>1. JSON 流式响应</h2>
    <button onclick="testJsonStream()">开始 (10 条数据)</button>
    <div id="json-output" class="output">等待开始...</div>
  </div>

  <div class="section">
    <h2>2. SSE 实时推送</h2>
    <button onclick="testSSE()">开始 SSE (10 秒)</button>
    <button onclick="stopSSE()">停止</button>
    <div id="sse-output" class="output">等待开始...</div>
  </div>

  <div class="section">
    <h2>3. 计数器流</h2>
    <button onclick="testCounter()">开始计数</button>
    <div id="counter-output" class="output">等待开始...</div>
  </div>

  <div class="section">
    <h2>4. 任务进度</h2>
    <button onclick="createTask()">创建任务</button>
    <button onclick="watchProgress()">开始订阅进度</button>
    <div id="progress-output" class="output">等待开始...</div>
  </div>

  <script>
    let sseSource = null

    function appendOutput(elementId, data, type = '') {
      const el = document.getElementById(elementId)
      const line = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      el.innerHTML += '<div class="event ' + type + '">' + line + '</div>'
      el.scrollTop = el.scrollHeight
    }

    async function testJsonStream() {
      const output = document.getElementById('json-output')
      output.innerHTML = '加载中...'
      
      const response = await fetch('/stream/json/10')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      output.innerHTML = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const text = decoder.decode(value)
        const lines = text.trim().split('\\n')
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              appendOutput('json-output', JSON.parse(line))
            } catch (e) {
              appendOutput('json-output', line)
            }
          }
        }
      }
    }

    function testSSE() {
      stopSSE()
      const output = document.getElementById('sse-output')
      output.innerHTML = '连接中...'
      
      sseSource = new EventSource('/stream/sse?duration=10000&interval=1000')
      
      sseSource.addEventListener('update', (e) => {
        appendOutput('sse-output', JSON.parse(e.data), 'update')
      })
      
      sseSource.addEventListener('complete', (e) => {
        appendOutput('sse-output', JSON.parse(e.data), 'complete')
        sseSource.close()
        sseSource = null
      })
      
      sseSource.addEventListener('error', (e) => {
        appendOutput('sse-output', '发生错误', 'error')
        sseSource.close()
        sseSource = null
      })
    }

    function stopSSE() {
      if (sseSource) {
        sseSource.close()
        sseSource = null
      }
    }

    function testCounter() {
      const output = document.getElementById('counter-output')
      output.innerHTML = '连接中...'
      
      const source = new EventSource('/stream/counter')
      
      source.onmessage = (e) => {
        appendOutput('counter-output', '计数：' + e.data)
      }
      
      source.onmessage = () => {
        source.close()
      }
    }

    async function createTask() {
      const response = await fetch('/tasks/long-running', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 5000, steps: 5 })
      })
      
      const result = await response.json()
      document.getElementById('progress-output').innerHTML = '任务 ID: ' + result.taskId
    }

    function watchProgress() {
      const output = document.getElementById('progress-output')
      const taskId = output.innerHTML.match(/task-\\d+/)
      
      if (!taskId) {
        output.innerHTML = '请先创建任务'
        return
      }
      
      output.innerHTML = '订阅进度中...'
      
      const source = new EventSource('/stream/progress/' + taskId[0])
      
      source.onmessage = (e) => {
        appendOutput('progress-output', JSON.parse(e.data))
        source.close()
      }
      
      source.onerror = () => {
        source.close()
      }
    }
  </script>
</body>
</html>
    `
  })

  .listen(3008)

console.log('🌊 流式响应服务运行在 http://localhost:3008')
console.log('📖 测试端点:')
console.log('   GET /stream/json/10 - JSON 流式响应 (10 条数据)')
console.log('   GET /stream/sse?duration=10000 - SSE 实时推送')
console.log('   GET /stream/counter - 计数器流 (1-10)')
console.log('   GET /stream/progress/task-123 - 任务进度流')
console.log('   POST /tasks/long-running - 创建长时间任务')
console.log('   GET /stream/test - 打开测试页面')
console.log('')
console.log('💡 使用 curl 测试 SSE:')
console.log('   curl -N http://localhost:3008/stream/counter')

export type StreamApp = typeof app
