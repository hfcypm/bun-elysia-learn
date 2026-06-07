/**
 * 练习 3.2 - 任务协作平台
 * 
 * 学习目标:
 * - 实现复杂的关联数据模型
 * - 用户与任务的关联
 * - 任务状态流转
 * - 评论系统
 * 
 * 功能要求:
 * 1. 项目管理
 * 2. 任务 CRUD
 * 3. 任务分配
 * 4. 状态变更
 * 5. 评论功能
 */

import { Elysia, t } from 'elysia'

// 枚举定义
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 用户类型
interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member'
  createdAt: Date
}

// 项目类型
interface Project {
  id: number
  name: string
  description: string
  owner: number  // 用户 ID
  members: number[]  // 成员 ID 列表
  color: string
  createdAt: Date
  updatedAt: Date
}

// 任务类型
interface Task {
  id: number
  projectId: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: number  // 负责人 ID
  reporter: number  // 报告人 ID
  tags: string[]
  dueDate?: Date
  points?: number  // 故事点
  createdAt: Date
  updatedAt: Date
}

// 评论类型
interface Comment {
  id: number
  taskId: number
  author: number  // 用户 ID
  content: string
  createdAt: Date
  updatedAt: Date
}

// 内存存储
const users = new Map<number, User>()
const projects = new Map<number, Project>()
const tasks = new Map<number, Task>()
const comments = new Map<number, Comment>()

let nextUserId = 1
let nextProjectId = 1
let nextTaskId = 1
let nextCommentId = 1

// 初始化示例数据
const initUsers: Omit<User, 'id' | 'createdAt'>[] = [
  { name: '张三', email: 'zhangsan@example.com', role: 'admin' as const },
  { name: '李四', email: 'lisi@example.com', role: 'member' as const },
  { name: '王五', email: 'wangwu@example.com', role: 'member' as const }
]

initUsers.forEach(user => {
  const id = nextUserId++
  users.set(id, { ...user, id, createdAt: new Date() })
})

const initProjects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Elysia.js 学习项目', description: 'Elysia.js 框架学习与案例开发', owner: 1, members: [1, 2, 3], color: '#7C3AED' },
  { name: '网站重构', description: '公司官网重构项目', owner: 1, members: [1, 2], color: '#2563EB' }
]

initProjects.forEach(project => {
  const id = nextProjectId++
  projects.set(id, { ...project, id, createdAt: new Date(), updatedAt: new Date() })
})

const initTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { projectId: 1, title: '完成基础案例', description: '实现 01-hello 和 02-http-methods', status: 'done' as const, priority: 'high' as const, assignee: 2, reporter: 1, tags: ['开发', '案例'], points: 5 },
  { projectId: 1, title: '实现中间件系统', description: '学习和实现各类中间件', status: 'in_progress' as const, priority: 'high' as const, assignee: 3, reporter: 1, tags: ['开发', '中间件'], points: 8 },
  { projectId: 1, title: '编写测试用例', description: '为核心功能编写单元测试', status: 'todo' as const, priority: 'medium' as const, assignee: 2, reporter: 1, tags: ['测试'], points: 5 },
  { projectId: 2, title: '设计新 UI', description: '完成首页和新页面的 UI 设计', status: 'review' as const, priority: 'urgent' as const, assignee: 3, reporter: 1, tags: ['设计', 'UI'], points: 13 }
]

initTasks.forEach(task => {
  const id = nextTaskId++
  tasks.set(id, { ...task, id, createdAt: new Date(), updatedAt: new Date() })
})

// 辅助函数：获取用户信息
function getUserInfo(userId: number) {
  const user = users.get(userId)
  return user ? { id: user.id, name: user.name, avatar: user.avatar } : null
}

// 辅助函数：获取项目中的所有任务
function getProjectTasks(projectId: number) {
  return Array.from(tasks.values()).filter(t => t.projectId === projectId)
}

const app = new Elysia()
  // ==================== 用户模块 ====================
  .group('/users', app => app
    .get('/', () => {
      return {
        success: true,
        data: Array.from(users.values()).map(u => ({
          ...u,
          projectsCount: Array.from(projects.values()).filter(p => p.members.includes(u.id)).length,
          tasksCount: Array.from(tasks.values()).filter(t => t.assignee === u.id).length
        }))
      }
    })
    .get('/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      const user = users.get(id)
      
      if (!user) {
        set.status = 404
        return { success: false, error: '用户不存在' }
      }

      return {
        success: true,
        data: {
          ...user,
          projects: Array.from(projects.values()).filter(p => p.members.includes(id)),
          assignedTasks: Array.from(tasks.values()).filter(t => t.assignee === id)
        }
      }
    })
  )

  // ==================== 项目模块 ====================
  .group('/projects', app => app
    // GET /projects - 获取所有项目
    .get('/', () => {
      return {
        success: true,
        data: Array.from(projects.values()).map(p => ({
          ...p,
          ownerInfo: getUserInfo(p.owner),
          tasksCount: getProjectTasks(p.id).length,
          tasksByStatus: {
            todo: getProjectTasks(p.id).filter(t => t.status === 'todo').length,
            in_progress: getProjectTasks(p.id).filter(t => t.status === 'in_progress').length,
            review: getProjectTasks(p.id).filter(t => t.status === 'review').length,
            done: getProjectTasks(p.id).filter(t => t.status === 'done').length
          }
        }))
      }
    })

    // POST /projects - 创建项目
    .post('', ({ body, set }) => {
      const { name, description, owner, members = [], color = '#7C3AED' } = body

      if (!name || !owner) {
        set.status = 400
        return { success: false, error: '缺少必填字段' }
      }

      if (!users.has(owner)) {
        set.status = 400
        return { success: false, error: '项目所有者不存在' }
      }

      const project: Project = {
        id: nextProjectId++,
        name,
        description,
        owner,
        members: [owner, ...members.filter(id => id !== owner)],
        color,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      projects.set(project.id, project)

      set.status = 201
      return {
        success: true,
        message: '项目创建成功',
        data: project
      }
    })

    // GET /projects/:id - 获取项目详情
    .get('/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      const project = projects.get(id)
      
      if (!project) {
        set.status = 404
        return { success: false, error: '项目不存在' }
      }

      const projectTasks = getProjectTasks(id)

      return {
        success: true,
        data: {
          ...project,
          ownerInfo: getUserInfo(project.owner),
          membersInfo: project.members.map(m => getUserInfo(m)).filter(Boolean),
          tasks: projectTasks.map(t => ({
            ...t,
            assigneeInfo: getUserInfo(t.assignee!),
            reporterInfo: getUserInfo(t.reporter)
          })),
          tasksByStatus: {
            todo: projectTasks.filter(t => t.status === 'todo').length,
            in_progress: projectTasks.filter(t => t.status === 'in_progress').length,
            review: projectTasks.filter(t => t.status === 'review').length,
            done: projectTasks.filter(t => t.status === 'done').length
          }
        }
      }
    })

    // PUT /projects/:id - 更新项目
    .put('/:id', ({ params, body, set }) => {
      const id = parseInt(params.id)
      const project = projects.get(id)
      
      if (!project) {
        set.status = 404
        return { success: false, error: '项目不存在' }
      }

      const updated: Project = {
        ...project,
        name: body.name ?? project.name,
        description: body.description ?? project.description,
        members: body.members ?? project.members,
        color: body.color ?? project.color,
        updatedAt: new Date()
      }

      projects.set(id, updated)

      return {
        success: true,
        message: '项目更新成功',
        data: updated
      }
    })
  )

  // ==================== 任务模块 ====================
  .group('/tasks', app => app
    // GET /tasks - 获取所有任务 (支持筛选)
    .get('/', ({ query }) => {
      let result = Array.from(tasks.values())

      // 筛选：项目
      if (query.projectId) {
        result = result.filter(t => t.projectId === Number(query.projectId))
      }

      // 筛选：状态
      if (query.status) {
        result = result.filter(t => t.status === query.status)
      }

      // 筛选：优先级
      if (query.priority) {
        result = result.filter(t => t.priority === query.priority)
      }

      // 筛选：负责人
      if (query.assignee) {
        result = result.filter(t => t.assignee === Number(query.assignee))
      }

      return {
        success: true,
        data: result.map(t => ({
          ...t,
          project: projects.get(t.projectId),
          assigneeInfo: getUserInfo(t.assignee!),
          reporterInfo: getUserInfo(t.reporter),
          commentsCount: Array.from(comments.values()).filter(c => c.taskId === t.id).length
        }))
      }
    })

    // POST /tasks - 创建任务
    .post('', ({ body, set }) => {
      const { projectId, title, description, priority, assignee, reporter, tags = [], points, dueDate } = body

      if (!projectId || !title || !reporter) {
        set.status = 400
        return { success: false, error: '缺少必填字段' }
      }

      if (!projects.has(projectId)) {
        set.status = 400
        return { success: false, error: '项目不存在' }
      }

      if (assignee && !users.has(assignee)) {
        set.status = 400
        return { success: false, error: '负责人不存在' }
      }

      const task: Task = {
        id: nextTaskId++,
        projectId,
        title,
        description,
        status: 'todo',
        priority: priority || 'medium',
        assignee,
        reporter,
        tags,
        points,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      tasks.set(task.id, task)

      set.status = 201
      return {
        success: true,
        message: '任务创建成功',
        data: {
          ...task,
          assigneeInfo: getUserInfo(task.assignee!),
          reporterInfo: getUserInfo(task.reporter)
        }
      }
    })

    // PATCH /tasks/:id/status - 更新任务状态
    .patch('/:id/status', ({ params, body, set }) => {
      const id = parseInt(params.id)
      const task = tasks.get(id)
      
      if (!task) {
        set.status = 404
        return { success: false, error: '任务不存在' }
      }

      const { status } = body

      const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
      if (!validStatuses.includes(status)) {
        set.status = 400
        return { success: false, error: '无效的状态值' }
      }

      task.status = status
      task.updatedAt = new Date()
      tasks.set(id, task)

      return {
        success: true,
        message: '任务状态已更新',
        data: { ...task, status }
      }
    })

    // PUT /tasks/:id - 更新任务
    .put('/:id', ({ params, body, set }) => {
      const id = parseInt(params.id)
      const task = tasks.get(id)
      
      if (!task) {
        set.status = 404
        return { success: false, error: '任务不存在' }
      }

      const updated: Task = {
        ...task,
        title: body.title ?? task.title,
        description: body.description ?? task.description,
        status: body.status ?? task.status,
        priority: body.priority ?? task.priority,
        assignee: body.assignee !== undefined ? body.assignee : task.assignee,
        tags: body.tags ?? task.tags,
        points: body.points ?? task.points,
        dueDate: body.dueDate ? new Date(body.dueDate) : task.dueDate,
        updatedAt: new Date()
      }

      tasks.set(id, updated)

      return {
        success: true,
        message: '任务更新成功',
        data: updated
      }
    })

    // DELETE /tasks/:id - 删除任务
    .delete('/:id', ({ params, set }) => {
      const id = parseInt(params.id)
      const deleted = tasks.delete(id)
      
      if (!deleted) {
        set.status = 404
        return { success: false, error: '任务不存在' }
      }

      // 同时删除相关评论
      for (const [commentId, comment] of comments.entries()) {
        if (comment.taskId === id) {
          comments.delete(commentId)
        }
      }

      return {
        success: true,
        message: '任务删除成功'
      }
    })
  )

  // ==================== 评论模块 ====================
  .group('/tasks/:taskId/comments', app => app
    // GET /tasks/:taskId/comments - 获取任务评论
    .get('/', ({ params, set }) => {
      const taskId = parseInt(params.taskId)
      
      if (!tasks.has(taskId)) {
        set.status = 404
        return { success: false, error: '任务不存在' }
      }

      const taskComments = Array.from(comments.values())
        .filter(c => c.taskId === taskId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      return {
        success: true,
        data: taskComments.map(c => ({
          ...c,
          authorInfo: getUserInfo(c.author)
        }))
      }
    })

    // POST /tasks/:taskId/comments - 添加评论
    .post('', ({ params, body, set }) => {
      const taskId = parseInt(params.taskId)
      
      if (!tasks.has(taskId)) {
        set.status = 404
        return { success: false, error: '任务不存在' }
      }

      const { author, content } = body

      if (!author || !content) {
        set.status = 400
        return { success: false, error: '缺少必填字段' }
      }

      if (!users.has(author)) {
        set.status = 400
        return { success: false, error: '用户不存在' }
      }

      const comment: Comment = {
        id: nextCommentId++,
        taskId,
        author,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      comments.set(comment.id, comment)

      set.status = 201
      return {
        success: true,
        message: '评论添加成功',
        data: {
          ...comment,
          authorInfo: getUserInfo(comment.author)
        }
      }
    })
  )

  .listen(3006)

console.log('📋 任务协作平台 API 运行在 http://localhost:3006')
console.log('📖 测试端点:')
console.log('   === 用户模块 ===')
console.log('   GET /users - 获取所有用户')
console.log('   GET /users/1 - 获取用户详情')
console.log('   === 项目模块 ===')
console.log('   GET /projects - 获取所有项目')
console.log('   GET /projects/1 - 获取项目详情 (含任务)')
console.log('   POST /projects - 创建项目')
console.log('   === 任务模块 ===')
console.log('   GET /tasks?projectId=1 - 获取任务列表')
console.log('   GET /tasks?status=todo - 按状态筛选')
console.log('   POST /tasks - 创建任务')
console.log('   PATCH /tasks/1/status - 更新任务状态')
console.log('   === 评论模块 ===')
console.log('   GET /tasks/1/comments - 获取任务评论')
console.log('   POST /tasks/1/comments - 添加评论')

export type TaskPlatformApp = typeof app
