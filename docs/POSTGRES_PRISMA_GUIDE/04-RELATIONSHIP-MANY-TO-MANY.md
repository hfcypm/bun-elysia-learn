# 阶段四：高级关联（多对多）

> 学习时间：3 小时 | 难度：⭐⭐⭐⭐

---

## 4.1 多对多关系概述

### 什么是多对多关系？

多对多关系是指：
- 一个 A 记录可以关联多个 B 记录
- 一个 B 记录也可以关联多个 A 记录

**经典示例：**
- 文章 ↔ 标签（一篇文章有多个标签，一个标签对应多篇文章）
- 学生 ↔ 课程（一个学生选多门课，一门课有多个学生）
- 用户 ↔ 角色（一个用户有多个角色，一个角色有多个用户）

---

## 4.2 多对多关系定义方式

### 方式一：隐式多对多（推荐简单场景）

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  tags  Tag[]  // 多对多关联
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[] // 多对多关联
}
```

**特点：**
- ✅ 语法简洁
- ✅ 不需要手动管理中间表
- ⚠️ 中间表只有两个字段（postId, tagId）
- ⚠️ 无法在关联上添加额外字段

### 方式二：显式多对多（推荐复杂场景）

```prisma
model Post {
  id       Int        @id @default(autoincrement())
  title    String
  postTags PostTag[] // 显式中间表
}

model Tag {
  id      Int        @id @default(autoincrement())
  name    String     @unique
  postTags PostTag[] // 显式中间表
}

// 显式中间表
model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])  // 复合主键
}
```

**特点：**
- ✅ 可以在中间表添加字段
- ✅ 更灵活的控制
- ⚠️ 语法稍复杂

---

## 4.3 隐式多对多 CRUD

### 创建关联

```typescript
// 创建文章关联标签
const post = await prisma.post.create({
  data: {
    title: 'Prisma 教程',
    content: '...',
    tags: {
      connect: [
        { name: 'Prisma' },
        { name: 'TypeScript' }
      ]
    }
  },
  include: {
    tags: true
  }
});
```

### connectOrCreate（不存在则创建）

```typescript
const post = await prisma.post.create({
  data: {
    title: 'PostgreSQL 性能优化',
    content: '...',
    tags: {
      connectOrCreate: [
        {
          where: { name: 'PostgreSQL' },  // 尝试连接
          create: { name: 'PostgreSQL' }  // 不存在则创建
        },
        {
          where: { name: '数据库' },
          create: { name: '数据库' }
        }
      ]
    }
  }
});
```

### 更新关联（替换全部）

```typescript
// set 会替换所有现有标签
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [
        { name: 'Prisma' },
        { name: 'PostgreSQL' }
      ]
    }
  }
});
```

### 更新关联（添加/移除）

```typescript
// 添加标签
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [
        { name: '教程' }
      ]
    }
  }
});

// 移除标签
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      disconnect: [
        { name: '临时' }
      ]
    }
  }
});
```

### 查询关联

```typescript
// 查询文章及其标签
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    tags: true
  }
});

// 查询某个标签下的所有文章
const tag = await prisma.tag.findUnique({
  where: { name: 'Prisma' },
  include: {
    posts: true
  }
});
```

---

## 4.4 显式多对多 CRUD

### Schema 定义（带额外字段）

```prisma
model Post {
  id       Int        @id @default(autoincrement())
  title    String
  postTags PostTag[]
}

model Tag {
  id      Int        @id @default(autoincrement())
  name    String     @unique
  postTags PostTag[]
}

// 中间表可以添加额外字段
model PostTag {
  postId    Int
  tagId     Int
  addedBy   Int      // 添加者的 ID
  addedAt   DateTime @default(now())  // 添加时间
  
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@index([postId])
  @@index([tagId])
}
```

### 创建关联（包含中间表字段）

```typescript
await prisma.postTag.create({
  data: {
    postId: 1,
    tagId: 1,
    addedBy: 1
  }
});
```

### 嵌套创建

```typescript
const post = await prisma.post.create({
  data: {
    title: '文章标题',
    postTags: {
      create: [
        { tag: { connectOrCreate: { where: { name: 'Prisma' }, create: { name: 'Prisma' } } } },
        { tag: { connectOrCreate: { where: { name: 'TypeScript' }, create: { name: 'TypeScript' } } } }
      ]
    }
  },
  include: {
    postTags: {
      include: {
        tag: true
      }
    }
  }
});
```

---

## 4.5 实战示例：博客标签系统

### 完整 Schema

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  status    PostStatus @default(DRAFT)
  createdAt DateTime @default(now())
  
  // 关联
  tags PostTag[]
  
  @@index([status])
}

model Tag {
  id       Int        @id @default(autoincrement())
  name     String     @unique
  posts    PostTag[]
}

// 显式中间表
model PostTag {
  id        Int      @id @default(autoincrement())
  postId    Int
  tagId     Int
  createdAt DateTime @default(now())
  
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([postId, tagId])
  @@index([postId])
  @@index([tagId])
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 完整操作示例

```typescript
// 1. 创建标签
const tags = await Promise.all(
  ['TypeScript', 'Prisma', 'PostgreSQL', '教程'].map(name =>
    prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  )
);

// 2. 创建文章关联标签
const post = await prisma.post.create({
  data: {
    title: 'Prisma 完全教程',
    slug: 'prisma-tutorial',
    content: '这是一篇详细的 Prisma 教程...',
    status: 'PUBLISHED',
    tags: {
      create: tags.map(tag => ({
        tag: { connect: { id: tag.id } }
      }))
    }
  },
  include: {
    tags: {
      include: {
        tag: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }
  }
});

// 3. 查询文章及标签
const postWithTags = await prisma.post.findUnique({
  where: { id: post.id },
  include: {
    tags: {
      select: {
        tag: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }
  }
});

console.log(postWithTags.tags.map(t => t.tag.name));
// ['TypeScript', 'Prisma', 'PostgreSQL', '教程']

// 4. 查询某个标签下的所有文章
const tagWithPosts = await prisma.tag.findUnique({
  where: { name: 'Prisma' },
  include: {
    posts: {
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true
      }
    }
  }
});

// 5. 给文章添加新标签
await prisma.post.update({
  where: { id: post.id },
  data: {
    tags: {
      create: {
        tag: {
          connectOrCreate: {
            where: { name: '数据库' },
            create: { name: '数据库' }
          }
        }
      }
    }
  }
});

// 6. 移除文章的某个标签
await prisma.postTag.delete({
  where: {
    postId_tagId: {
      postId: post.id,
      tagId: tagToRemove.id
    }
  }
});

// 7. 替换所有标签
await prisma.post.update({
  where: { id: post.id },
  data: {
    tags: {
      set: [
        { tag: { connect: { name: 'Prisma' } } },
        { tag: { connect: { name: '高级教程' } } }
      ]
    }
  }
});

// 8. 统计每个标签的文章数
const tagStats = await prisma.tag.findMany({
  include: {
    _count: {
      select: {
        posts: {
          where: {
            post: {
              status: 'PUBLISHED'
            }
          }
        }
      }
    }
  },
  orderBy: {
    _count: {
      posts: 'desc'
    }
  }
});
```

---

## 4.6 实战示例：学生选课系统

### Schema 定义

```prisma
model Student {
  id          Int          @id @default(autoincrement())
  name        String
  studentId   String       @unique
  enrollments Enrollment[]
}

model Course {
  id          Int          @id @default(autoincrement())
  name        String
  code        String       @unique
  credits     Int
  teacherId   Int
  teacher     Teacher      @relation(fields: [teacherId], references: [id])
  enrollments Enrollment[]
}

model Teacher {
  id      Int      @id @default(autoincrement())
  name    String
  courses Course[]
}

// 选课记录（中间表+ 附加字段）
model Enrollment {
  id           Int      @id @default(autoincrement())
  studentId    Int
  courseId     Int
  student      Student  @relation(fields: [studentId], references: [id])
  course       Course   @relation(fields: [courseId], references: [id])
  enrolledAt   DateTime @default(now())
  
  // 成绩相关
  regularScore Decimal? @db.Decimal(5, 2)  // 平时成绩
  examScore    Decimal? @db.Decimal(5, 2)  // 期末成绩
  totalScore   Decimal? @db.Decimal(5, 2)  // 总成绩
  
  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
}
```

### 完整操作示例

```typescript
// 1. 创建学生
const student = await prisma.student.create({
  data: {
    name: '张三',
    studentId: '20240001'
  }
});

// 2. 创建课程
const courses = await prisma.course.createMany({
  data: [
    { name: '数据结构', code: 'CS101', credits: 4, teacherId: 1 },
    { name: '数据库系统', code: 'CS201', credits: 3, teacherId: 2 },
    { name: '操作系统', code: 'CS301', credits: 4, teacherId: 1 }
  ]
});

// 3. 学生选课（多对多）
const enrollment = await prisma.enrollment.create({
  data: {
    studentId: student.id,
    courseId: 1  // 选修 CS101
  },
  include: {
    student: true,
    course: true
  }
});

// 4. 查询学生已选课程
const studentWithCourses = await prisma.student.findUnique({
  where: { id: student.id },
  include: {
    enrollments: {
      include: {
        course: {
          include: {
            teacher: true
          }
        }
      }
    }
  }
});

// 5. 查询课程已选学生
const courseWithStudents = await prisma.course.findUnique({
  where: { id: 1 },
  include: {
    enrollments: {
      include: {
        student: true
      },
      orderBy: {
        student: {
          studentId: 'asc'
        }
      }
    },
    _count: {
      select: { enrollments: true }
    }
  }
});

console.log(`已选人数：${courseWithStudents._count.enrollments}`);

// 6. 录入成绩
await prisma.enrollment.update({
  where: {
    studentId_courseId: {
      studentId: student.id,
      courseId: 1
    }
  },
  data: {
    regularScore: 85,
    examScore: 90,
    totalScore: 85 * 0.3 + 90 * 0.7  // 平时 30% + 期末 70%
  }
});

// 7. 查询学生成绩单
const grades = await prisma.enrollment.findMany({
  where: { studentId: student.id },
  include: {
    course: {
      select: {
        name: true,
        credits: true,
        code: true
      }
    }
  },
  orderBy: {
    course: {
      code: 'asc'
    }
  }
});

// 8. 退课
await prisma.enrollment.delete({
  where: {
    studentId_courseId: {
      studentId: student.id,
      courseId: 2
    }
  }
});

// 9. 检查是否已选
const exists = await prisma.enrollment.findUnique({
  where: {
    studentId_courseId: {
      studentId: student.id,
      courseId: 1
    }
  }
});

if (exists) {
  console.log('已选修该课程');
}
```

---

## 4.7 性能优化

### 使用 select 减少数据量

```typescript
// ❌ 不推荐：返回所有字段
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    tags: {
      include: { tag: true }
    }
  }
});

// ✅ 推荐：只返回需要的字段
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    tags: {
      select: {
        tag: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }
  }
});
```

### 批量加载关联

```typescript
// ✅ 推荐：使用 include 批量加载
const posts = await prisma.post.findMany({
  include: {
    tags: {
      select: { tag: true }
    }
  }
});

// ❌ 避免：N+1 查询
const posts = await prisma.post.findMany();
for (const post of posts) {
  const tags = await prisma.postTag.findMany({
    where: { postId: post.id },
    include: { tag: true }
  });
}
```

---

## 📝 练习 4.1：用户角色系统

**任务：** 实现用户多角色管理

**要求：**
1. 一个用户可以有多个角色
2. 一个角色可以有多个用户
3. 中间表包含授权人、授权时间
4. 查询用户角色和角色用户

**Schema 提示：**
```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  userRoles UserRole[]
}

model Role {
  id        Int        @id @default(autoincrement())
  name      String     @unique
  userRoles UserRole[]
}

model UserRole {
  userId    Int
  roleId    Int
  grantedBy Int
  grantedAt DateTime @default(now())
  
  user User @relation(...)
  role Role @relation(...)
  
  @@id([userId, roleId])
}
```

---

## 📝 练习 4.2：图书借阅系统

**任务：** 实现图书馆借阅管理

**要求：**
1. 一个读者可以借多本书
2. 一本书可以被多个读者借阅（历史记录）
3. 借阅记录包含借出时间、归还时间、状态
4. 查询读者借阅历史和图书借阅历史

**参考答案：** 参考学生选课系统设计

---

## 📚 阶段四总结

### 知识点回顾

| 知识点 | 重要程度 | 掌握要求 |
|--------|----------|----------|
| 隐式多对多定义 | ⭐⭐⭐⭐ | 熟练 |
| 显式多对多定义 | ⭐⭐⭐⭐⭐ | 精通 |
| connectOrCreate | ⭐⭐⭐⭐⭐ | 精通 |
| 中间表操作 | ⭐⭐⭐⭐ | 熟练 |
| 嵌套创建/更新 | ⭐⭐⭐⭐ | 熟练 |
| set/connect/disconnect | ⭐⭐⭐⭐ | 精通 |

### 下一步

完成本章后，你应该能够：
- ✅ 设计多对多关系的数据模型
- ✅ 灵活使用隐式/显式多对多
- ✅ 处理复杂的多对多业务场景

准备好进入**阶段五：事务与锁机制**！

---

## 🔗 参考资源

- [多对多关系文档](https://prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations)
- [显式多对多](https://prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations#using-a-reference-model)
- [示例代码 - 博客系统](../../examples/postgres-prisma/blog-system.ts)
- [示例代码 - 学生课程](../../examples/postgres-prisma/student-course.ts)
