# 阶段六：实战项目综合

> 学习时间：4 小时 | 难度：⭐⭐⭐⭐⭐

---

## 6.1 项目需求分析

### 项目背景

开发一个**在线学习平台**，包含以下核心功能：

**用户角色：**
- 学员：浏览课程、选课、学习、提交作业
- 教师：创建课程、布置作业、批改作业
- 管理员：用户管理、内容审核

**核心功能模块：**
1. 用户认证系统
2. 课程管理
3. 选课系统
4. 作业提交与批改
5. 成绩管理
6. 评论问答

---

## 6.2 数据模型设计

### 完整 schema

```prisma
// 用户与认证
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  avatar    String?
  role      Role     @default(STUDENT)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  // 关联
  enrolledCourses Enrollment[]
  createdCourses  Course[]
  submissions     Submission[]
  comments        Comment[]
  likes           Like[]
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}

// 课程管理
model Course {
  id          Int      @id @default(autoincrement()]
  title       String
  description String?
  thumbnail   String?
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联
  teacherId   Int
  teacher     User     @relation(fields: [teacherId], references: [id])
  lessons     Lesson[]
  enrollments Enrollment[]
  comments    Comment[]
}

// 课程章节
model Lesson {
  id        Int      @id @default(autoincrement()]
  courseId  Int
  course    Course   @relation(fields: [courseId], references: [id])
  title     String
  content   String   @db.Text
  order     Int
  duration  Int?     // 视频时长（秒）
  isFree    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  // 关联
  exercises Exercise[]
  materials Material[]
}

// 选课记录
model Enrollment {
  id           Int      @id @default(autoincrement()]
  studentId    Int
  courseId     Int
  student      User     @relation(fields: [studentId], references: [id])
  course       Course   @relation(fields: [courseId], references: [id])
  progress     Int      @default(0)  // 学习进度 0-100
  enrolledAt   DateTime @default(now())
  completedAt  DateTime?
  
  // 关联
  submissions Submission[]
  
  @@unique([studentId, courseId])
}

// 作业练习
model Exercise {
  id        Int      @id @default(autoincrement()]
  lessonId  Int
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  title     String
  content   String   @db.Text
  dueDate   DateTime?
  maxScore  Int      @default(100)
  createdAt DateTime @default(now())
  
  // 关联
  submissions Submission[]
}

// 作业提交
model Submission {
  id           Int         @id @default(autoincrement()]
  enrollmentId Int
  exerciseId   Int
  content      String      @db.Text
  attachment   String?
  status       SubmissionStatus @default(PENDING)
  score        Int?
  feedback     String?
  submittedAt  DateTime    @default(now())
  gradedAt     DateTime?
  
  // 关联
  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  exercise   Exercise   @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  studentId  Int
  student    User       @relation(fields: [studentId], references: [id])
  
  @@index([enrollmentId])
  @@index([exerciseId])
}

enum SubmissionStatus {
  PENDING
  SUBMITTED
  GRADED
}

// 课程资料
model Material {
  id        Int      @id @default(autoincrement()]
  lessonId  Int
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  title     String
  url       String
  fileType  String
  fileSize  Int
  createdAt DateTime @default(now())
}

// 评论问答
model Comment {
  id        Int      @id @default(autoincrement()]
  content   String
  parentId  Int?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  likes     Int      @default(0)
  createdAt DateTime @default(now())
  
  // 关联
  courseId  Int?
  course    Course?  @relation(fields: [courseId], references: [id])
  lessonId  Int?
  lesson    Lesson?  @relation(fields: [lessonId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  
  @@index([courseId])
  @@index([lessonId])
}

// 点赞
model Like {
  id        Int      @id @default(autoincrement()]
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  commentId Int?
  comment   Comment? @relation(fields: [commentId], references: [id])
  createdAt DateTime @default(now())
  
  @@unique([userId, commentId])
}
```

---

## 6.3 核心功能实现

### 功能 1：用户注册与登录

```typescript
// 用户注册
async function register(email: string, password: string, name: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'STUDENT'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  
  return user;
}

// 用户登录
async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('密码错误');
  }
  
  // 生成 jwt Token
  const token = await generateJWT(user);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  };
}
```

---

### 功能 2：创建课程

```typescript
// 教师创建课程
async function createCourse(teacherId: number, data: {
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
}) {
  return await prisma.course.create({
    data: {
      ...data,
      teacher: { connect: { id: teacherId } }
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });
}

// 添加课程章节
async function createLesson(courseId: number, data: {
  title: string;
  content: string;
  order: number;
  duration?: number;
  isFree?: boolean;
}) {
  return await prisma.lesson.create({
    data: {
      ...data,
      course: { connect: { id: courseId } }
    }
  });
}

// 批量添加章节（事务）
async function createLessons(courseId: number, lessons: Array<{
  title: string;
  content: string;
  order: number;
}>) {
  return await prisma.$transaction(
    lessons.map(data => 
      prisma.lesson.create({
        data: {
          ...data,
          courseId
        }
      })
    )
  );
}
```

---

### 功能 3：选课系统

```typescript
// 学生选课
async function enrollCourse(studentId: number, courseId: number) {
  // 检查是否已选
  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId
      }
    }
  });
  
  if (existing) {
    throw new Error('已选修该课程');
  }
  
  // 创建选课记录
  return await prisma.enrollment.create({
    data: {
      studentId,
      courseId
    },
    include: {
      course: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      student: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

// 查询学生已选课程
async function getStudentCourses(studentId: number) {
  return await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { lessons: true }
          }
        }
      },
      submissions: {
        where: { status: 'GRADED' }
      }
    },
    orderBy: {
      enrolledAt: 'desc'
    }
  });
}
```

---

### 功能 4：作业提交与批改

```typescript
// 提交作业
async function submitAssignment(enrollmentId: number, exerciseId: number, content: string, attachment?: string) {
  return await prisma.submission.create({
    data: {
      enrollmentId,
      exerciseId,
      content,
      attachment,
      status: 'SUBMITTED',
      studentId: (await prisma.enrollment.findUnique({
        where: { id: enrollmentId }
      }))?.studentId
    },
    include: {
      exercise: {
        include: {
          lesson: true
        }
      }
    }
  });
}

// 批改作业（事务）
async function gradeSubmission(submissionId: number, score: number, feedback: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 更新提交状态
    const submission = await tx.submission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        status: 'GRADED',
        gradedAt: new Date()
      },
      include: {
        enrollment: true,
        exercise: true
      }
    });
    
    // 2. 更新学生进度（示例：按完成作业数计算）
    const totalSubmissions = await tx.submission.count({
      where: {
        enrollmentId: submission.enrollmentId,
        status: 'GRADED'
      }
    });
    
    const totalExercises = await tx.exercise.count({
      where: {
        lesson: {
          course: {
            enrollments: {
              some: { id: submission.enrollmentId }
            }
          }
        }
      }
    });
    
    const progress = Math.round((totalSubmissions / totalExercises) * 100);
    
    await tx.enrollment.update({
      where: { id: submission.enrollmentId },
      data: { progress }
    });
    
    return submission;
  });
}
```

---

### 功能 5：成绩统计

```typescript
// 查询学生成绩单
async function getStudentGrades(studentId: number) {
  const submissions = await prisma.submission.findMany({
    where: { studentId, status: 'GRADED' },
    include: {
      exercise: {
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  title: true,
                  teacher: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });
  
  // 计算平均分
  const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
  const average = submissions.length > 0 ? totalScore / submissions.length : 0;
  
  return {
    submissions: total,
    average,
    submissions
  };
}

// 教师查看课程学生成绩
async function getCourseGrades(courseId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      submissions: {
        where: { status: 'GRADED' },
        include: {
          exercise: {
            select: {
              title: true,
              maxScore: true
            }
          }
        }
      }
    }
  });
  
  return enrollments.map(enrollment => {
    const totalScore = enrollment.submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const maxScore = enrollment.submissions.reduce((sum, sub) => sum + sub.exercise.maxScore, 0);
    
    return {
      student: enrollment.student,
      progress: enrollment.progress,
      averageScore: enrollment.submissions.length > 0 ? totalScore / enrollment.submissions.length : 0,
      totalScore,
      maxScore,
      submissionCount: enrollment.submissions.length
    };
  });
}
```

---

### 功能 6：评论问答系统

```typescript
// 添加评论
async function addComment(courseId: number, authorId: number, content: string, parentId?: number) {
  return await prisma.comment.create({
    data: {
      content,
      courseId,
      authorId,
      parentId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      parent: {
        select: {
          id: true,
          content: true,
          author: {
            select: { name: true }
          }
        }
      }
    }
  });
}

// 获取课程评论（树形结构）
async function getCourseComments(courseId: number) {
  // 获取顶级评论
  const parentComments = await prisma.comment.findMany({
    where: { courseId, parentId: null },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { replies: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return parentComments;
}

// 点赞评论
async function toggleLike(commentId: number, userId: number) {
  const existing = await prisma.like.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId
      }
    }
  });
  
  if (existing) {
    // 取消点赞
    await prisma.like.delete({
      where: { id: existing.id }
    });
    
    await prisma.comment.update({
      where: { id: commentId },
      data: { likes: { decrement: 1 } }
    });
    
    return false;
  } else {
    // 点赞
    await prisma.like.create({
      data: {
        userId,
        commentId
      }
    });
    
    await prisma.comment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } }
    });
    
    return true;
  }
}
```

---

## 6.4 性能优化建议

### 1. 查询优化

```typescript
// ✅ 推荐：使用 select 减少数据量
const courses = await prisma.course.findMany({
  select: {
    id: true,
    title: true,
    price: true,
    teacher: {
      select: {
        name: true
      }
    },
    _count: {
      select: { enrollments: true }
    }
  }
});

// ❌ 避免：返回所有字段
const courses = await prisma.course.findMany({
  include: { teacher: true }
});
```

### 2. 索引优化

```prisma
model Course {
  id        Int      @id @default(autoincrement()]
  title     String
  teacherId Int
  isActive  Boolean  @default(true)
  
  // 添加索引
  @@index([teacherId])
  @@index([isActive])
  @@index([createdAt])
}
```

### 3. 批量操作

```typescript
// ✅ 推荐：批量创建
await prisma.enrollment.createMany({
  data: enrollmentsData
});

// ❌ 避免：循环创建
for (const data of enrollmentsData) {
  await prisma.enrollment.create({ data });
}
```

---

## 6.5 测试与部署

### 数据库迁移

```bash
# 1. 生成迁移文件
bun x prisma migrate dev --name init_learning_platform

# 2. 生产环境应用迁移
bun x prisma migrate deploy

# 3. 生成 Prisma client
bun x prisma generate

# 4. 推送 schema（开发环境）
bun x prisma db push
```

### 种子数据

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      password: hashedPassword,
      name: '张老师',
      role: 'TEACHER'
    }
  });
  
  // 创建测试课程
  const course = await prisma.course.create({
    data: {
      title: 'typescript 入门教程',
      description: '从零开始学习 typescript',
      price: 99.00,
      teacherId: teacher.id
    }
  });
  
  console.log('种子数据创建成功');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

运行种子脚本：
```bash
bun x prisma db seed
```

---

## 📝 练习 6.1：完整项目实战

**任务：** 开发一个完整的博客平台

**要求：**
1. 用户系统（注册/登录/个人中心）
2. 文章系统（创建/编辑/删除/发布）
3. 评论系统（嵌套评论/点赞）
4. 标签系统（多对多）
5. 阅读统计（阅读量/点赞数）

**提示：** 综合使用前面所有章节的知识

---

## 📚 阶段六总结

完成本章后，你已经：
- ✅ 掌握了完整的数据库设计能力
- ✅ 能够独立开发复杂业务系统
- ✅ 理解了事务和锁的实际应用
- ✅ 具备了性能优化意识

恭喜你完成 postgresql + Prisma 全套教程！🎉

---

## 🎓 学习路线回顾

| 阶段 | 主题 | 关键技能 |
|------|------|----------|
| 一 | 环境准备 | schema 定义、迁移 |
| 二 | crud 基础 | 增删改查、条件查询 |
| 三 | 一对多关联 | include、嵌套查询 |
| 四 | 多对多关联 | connectOrCreate、中间表 |
| 五 | 事务与锁 | $transaction、乐观锁 |
| 六 | 实战综合 | 完整项目开发 |

---

## 📖 后续学习建议

1. **深入 Prisma 高级特性**
   - 中间件（Middleware）
   - 扩展（Extensions）
   - 加速缓存

2. **学习数据库优化**
   - 查询执行计划
   - 索引优化
   - 分库分表

3. **掌握生产实践**
   - 数据库备份
   - 监控告警
   - 数据迁移

---

## 🔗 参考资源

- [Prisma 官方文档](https://prisma.io/docs)
- [postgresql 官方文档](https://postgresql.org/docs)
- [示例代码目录](../../examples/postgres-prisma/)
