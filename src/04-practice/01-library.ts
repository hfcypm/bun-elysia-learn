/**
 * 练习 1.2 - 图书管理 CRUD
 * 
 * 学习目标:
 * - 实现完整的 CRUD 操作
 * - 使用内存存储管理数据
 * - 处理 HTTP 状态码
 * - 实现基础的数据验证
 * 
 * 功能要求:
 * 1. GET /books - 获取所有图书
 * 2. GET /books/:id - 获取单本图书
 * 3. POST /books - 创建新书
 * 4. PUT /books/:id - 更新图书信息
 * 5. DELETE /books/:id - 删除图书
 * 6. GET /books/search?keyword=xxx - 搜索图书
 */

import { Elysia, t } from 'elysia'

// 图书数据类型
interface Book {
  id: number
  title: string
  author: string
  isbn: string
  publishedYear: number
  price: number
  inStock: boolean
  createdAt: Date
}

// 内存存储
const books = new Map<number, Book>()
let nextId = 1

// 创建假数据
const sampleBooks: Omit<Book, 'id' | 'createdAt'>[] = [
  {
    title: 'Elysia.js 入门指南',
    author: '张三',
    isbn: '978-7-111-12345-6',
    publishedYear: 2024,
    price: 59.9,
    inStock: true
  },
  {
    title: 'TypeScript 高级编程',
    author: '李四',
    isbn: '978-7-111-23456-7',
    publishedYear: 2023,
    price: 79.9,
    inStock: true
  },
  {
    title: 'Bun 运行时实战',
    author: '王五',
    isbn: '978-7-111-34567-8',
    publishedYear: 2024,
    price: 69.9,
    inStock: false
  }
]

sampleBooks.forEach(book => {
  const id = nextId++
  books.set(id, { ...book, id, createdAt: new Date() })
})

const app = new Elysia()
  .group('/books', app => app
    // GET /books - 获取所有图书
    .get('/', () => {
      return {
        success: true,
        count: books.size,
        data: Array.from(books.values())
      }
    })

    // GET /books/search?keyword=xxx - 搜索图书
    .get('/search', ({ query }) => {
      const keyword = query.keyword?.toLowerCase()
      
      if (!keyword) {
        return {
          success: false,
          error: '请提供搜索关键词'
        }
      }

      const results = Array.from(books.values()).filter(book =>
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword) ||
        book.isbn.includes(keyword)
      )

      return {
        success: true,
        count: results.length,
        data: results
      }
    })

    // GET /books/:id - 获取单本图书
    .get('/:id', ({ params }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        return new Response('无效的图书 ID', { status: 400 })
      }

      const book = books.get(id)
      
      if (!book) {
        return new Response('图书不存在', { status: 404 })
      }

      return {
        success: true,
        data: book
      }
    })

    // POST /books - 创建新书
    .post('/', ({ body }) => {
      const { title, author, isbn, publishedYear, price, inStock = true } = body

      // 验证必填字段
      if (!title || !author || !isbn || !publishedYear || !price) {
        return new Response('缺少必填字段', { status: 400 })
      }

      // 验证 ISBN 格式 (简单的长度检查)
      if (isbn.length < 10 || isbn.length > 20) {
        return new Response('ISBN 格式不正确', { status: 400 })
      }

      // 验证出版年份
      const currentYear = new Date().getFullYear()
      if (publishedYear < 1450 || publishedYear > currentYear + 1) {
        return new Response('出版年份不正确', { status: 400 })
      }

      // 验证价格
      if (price < 0) {
        return new Response('价格不能为负数', { status: 400 })
      }

      const book: Book = {
        id: nextId++,
        title,
        author,
        isbn,
        publishedYear,
        price,
        inStock,
        createdAt: new Date()
      }

      books.set(book.id, book)

      return new Response(JSON.stringify({
        success: true,
        message: '图书创建成功',
        data: book
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    })

    // PUT /books/:id - 更新图书信息
    .put('/:id', ({ params, body }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        return new Response('无效的图书 ID', { status: 400 })
      }

      const existingBook = books.get(id)
      
      if (!existingBook) {
        return new Response('图书不存在', { status: 404 })
      }

      // 部分更新
      const updatedBook: Book = {
        ...existingBook,
        title: body.title ?? existingBook.title,
        author: body.author ?? existingBook.author,
        isbn: body.isbn ?? existingBook.isbn,
        publishedYear: body.publishedYear ?? existingBook.publishedYear,
        price: body.price ?? existingBook.price,
        inStock: body.inStock ?? existingBook.inStock
      }

      // 验证更新的数据
      if (updatedBook.isbn.length < 10 || updatedBook.isbn.length > 20) {
        return new Response('ISBN 格式不正确', { status: 400 })
      }

      const currentYear = new Date().getFullYear()
      if (updatedBook.publishedYear < 1450 || updatedBook.publishedYear > currentYear + 1) {
        return new Response('出版年份不正确', { status: 400 })
      }

      if (updatedBook.price < 0) {
        return new Response('价格不能为负数', { status: 400 })
      }

      books.set(id, updatedBook)

      return {
        success: true,
        message: '图书更新成功',
        data: updatedBook
      }
    })

    // DELETE /books/:id - 删除图书
    .delete('/:id', ({ params }) => {
      const id = parseInt(params.id)
      
      if (isNaN(id)) {
        return new Response('无效的图书 ID', { status: 400 })
      }

      const deleted = books.delete(id)
      
      if (!deleted) {
        return new Response('图书不存在', { status: 404 })
      }

      return {
        success: true,
        message: '图书删除成功'
      }
    })
  )
  .listen(3002)

console.log('📚 图书管理 API 运行在 http://localhost:3002')
console.log('📖 测试端点:')
console.log('   GET  /books - 获取所有图书')
console.log('   GET  /books/search?keyword=Elysia - 搜索图书')
console.log('   GET  /books/1 - 获取单本图书')
console.log('   POST /books - 创建新书')
console.log('   PUT  /books/1 - 更新图书')
console.log('   DELETE /books/1 - 删除图书')

export type BookApp = typeof app
