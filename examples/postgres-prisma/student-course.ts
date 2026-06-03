/**
 * PostgreSQL + Prisma 经典示例：多对多关系（学生 - 课程系统）
 * 
 * 功能：
 * - 学生管理
 * - 课程管理
 * - 选课系统（多对多）
 * - 成绩录入
 * - 学分统计
 * - 课程表查询
 * - 成绩分析
 * 
 * 技术栈：
 * - PostgreSQL 数据库
 * - Prisma ORM
 * - 多对多关系（@relation）
 * - 聚合查询
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 学生管理 ====================

async function createStudent(
  name: string,
  studentId: string,
  grade: string,
  major: string
) {
  const student = await prisma.student.create({
    data: {
      name,
      studentId,
      grade,
      major
    },
    include: {
      enrollments: {
        include: {
          course: true
        }
      }
    }
  });

  console.log('✅ 创建学生:', student.name, `(${student.studentId})`);
  return student;
}

async function getStudentWithCourses(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              teacher: true
            }
          }
        },
        orderBy: {
          course: {
            semester: 'desc'
          }
        }
      },
      _count: {
        select: { enrollments: true }
      }
    }
  });

  console.log(`📚 学生 ${student?.name} 已选${student?._count.enrollments}门课程`);
  return student;
}

// ==================== 课程管理 ====================

async function createCourse(
  name: string,
  code: string,
  credits: number,
  teacherId: number,
  semester: string,
  maxStudents: number
) {
  const course = await prisma.course.create({
    data: {
      name,
      code,
      credits,
      semester,
      maxStudents,
      teacherId
    },
    include: {
      teacher: true
    }
  });

  console.log('✅ 创建课程:', course.name, `(${course.code})`);
  return course;
}

async function getCourseWithStudents(courseId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: true,
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

  console.log(`📖 课程 ${course?.name}: ${course?._count.enrollments}/${course?.maxStudents} 人已选`);
  return course;
}

// ==================== 选课系统 ====================

async function enrollStudent(studentId: number, courseId: number) {
  // 检查课程容量
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  });

  if (!course) {
    throw new Error('课程不存在');
  }

  if (course._count.enrollments >= course.maxStudents) {
    throw new Error('课程已满');
  }

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

  // 检查时间冲突
  const studentEnrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: true }
  });

  const conflict = studentEnrollments.some(enrollment => 
    enrollment.course.schedule === course.schedule
  );

  if (conflict) {
    throw new Error('上课时间冲突');
  }

  // 创建选课记录
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId
    },
    include: {
      student: true,
      course: true
    }
  });

  console.log(`✅ 选课成功：${enrollment.student.name} -> ${enrollment.course.name}`);
  return enrollment;
}

async function dropCourse(studentId: number, courseId: number) {
  await prisma.enrollment.delete({
    where: {
      studentId_courseId: {
        studentId,
        courseId
      }
    }
  });

  console.log('❌ 退课成功');
}

// ==================== 成绩管理 ====================

async function recordGrade(
  enrollmentId: number,
  regularScore: number,
  examScore: number
) {
  const totalScore = regularScore * 0.3 + examScore * 0.7;
  
  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      regularScore,
      examScore,
      totalScore
    },
    include: {
      student: true,
      course: true
    }
  });

  console.log(`📝 成绩录入：${enrollment.student.name} - ${enrollment.course.name}: ${totalScore.toFixed(1)}分`);
  return enrollment;
}

async function getStudentGrades(studentId: number) {
  const grades = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: true,
      student: true
    },
    orderBy: {
      course: {
        semester: 'desc'
      }
    }
  });

  const gpa = calculateGPA(grades);

  console.log(`📊 学生 ${grades[0]?.student.name} 的成绩单（GPA: ${gpa.toFixed(2)}）`);
  console.table(
    grades.map(g => ({
      课程: g.course.name,
      学分: g.course.credits,
      平时成绩: g.regularScore,
      期末成绩: g.examScore,
      总成绩: g.totalScore?.toFixed(1)
    }))
  );

  return { grades, gpa };
}

// ==================== GPA 计算 ====================

function calculateGPA(grades: any[]) {
  const gradeToPoint = (score: number | null) => {
    if (!score) return 0;
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    if (score >= 82) return 3.3;
    if (score >= 78) return 3.0;
    if (score >= 75) return 2.7;
    if (score >= 72) return 2.3;
    if (score >= 68) return 2.0;
    if (score >= 65) return 1.5;
    if (score >= 60) return 1.0;
    return 0;
  };

  let totalPoints = 0;
  let totalCredits = 0;

  for (const grade of grades) {
    if (grade.totalScore !== null) {
      const points = gradeToPoint(grade.totalScore);
      totalPoints += points * grade.course.credits;
      totalCredits += grade.course.credits;
    }
  }

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// ==================== 学分统计 ====================

async function getStudentCredits(studentId: number) {
  const stats = await prisma.enrollment.aggregate({
    where: {
      studentId,
      totalScore: { gte: 60 }
    },
    _sum: {
      course: {
        credits: true
      }
    }
  });

  const allCredits = await prisma.enrollment.groupBy({
    by: ['studentId'],
    _sum: {
      course: {
        credits: true
      }
    },
    where: { studentId }
  });

  const earnedCredits = stats._sum?.course?.credits || 0;
  const requiredCredits = 120; // 毕业要求学分

  console.log(`🎓 学分统计：已修${earnedCredits}学分，还需${requiredCredits - earnedCredits}学分`);
  
  return {
    earned: earnedCredits,
    required: requiredCredits,
    remaining: requiredCredits - earnedCredits
  };
}

// ==================== 课程表查询 ====================

async function getStudentSchedule(studentId: number, semester: string) {
  const schedule = await prisma.enrollment.findMany({
    where: {
      studentId,
      course: { semester }
    },
    include: {
      course: {
        select: {
          name: true,
          code: true,
          credits: true,
          schedule: true,
          location: true,
          teacher: {
            select: {
              name: true,
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      course: {
        schedule: 'asc'
      }
    }
  });

  console.log(`📅 课程表（${semester}）：`);
  console.table(
    schedule.map(item => ({
      课程: item.course.name,
      教师: item.course.teacher.name,
      时间: item.course.schedule,
      地点: item.course.location,
      学分: item.course.credits
    }))
  );

  return schedule;
}

// ==================== 成绩分析 ====================

async function analyzeCourseScores(courseId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: {
      totalScore: true,
      student: {
        select: {
          name: true,
          grade: true
        }
      }
    }
  });

  const scores = enrollments.filter(e => e.totalScore !== null).map(e => e.totalScore!) as number[];

  if (scores.length === 0) {
    console.log('暂无成绩数据');
    return;
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const passRate = scores.filter(s => s >= 60).length / scores.length * 100;
  const excellentRate = scores.filter(s => s >= 90).length / scores.length * 100;

  console.log('📊 成绩分析:');
  console.log('平均分:', avg.toFixed(1));
  console.log('最高分:', max);
  console.log('最低分:', min);
  console.log('及格率:', `${passRate.toFixed(1)}%`);
  console.log('优秀率:', `${excellentRate.toFixed(1)}%`);

  return {
    average: avg,
    max,
    min,
    passRate,
    excellentRate,
    distribution: {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 80 && s < 90).length,
      medium: scores.filter(s => s >= 70 && s < 80).length,
      pass: scores.filter(s => s >= 60 && s < 70).length,
      fail: scores.filter(s => s < 60).length
    }
  };
}

// ==================== 主函数：演示流程 ====================

async function main() {
  console.log('🚀 PostgreSQL + Prisma 学生课程系统演示\n');

  // 1. 创建教师
  console.log('1️⃣  创建教师...');
  const teacher1 = await prisma.teacher.create({
    data: {
      name: '张教授',
      title: '教授',
      department: '计算机科学'
    }
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      name: '李副教授',
      title: '副教授',
      department: '计算机科学'
    }
  });

  // 2. 创建课程
  console.log('\n2️⃣  创建课程...');
  const course1 = await createCourse(
    '数据结构',
    'CS101',
    4,
    teacher1.id,
    '2024-春',
    30
  );

  const course2 = await createCourse(
    '数据库系统',
    'CS201',
    3,
    teacher2.id,
    '2024-春',
    25
  );

  const course3 = await createCourse(
    '操作系统',
    'CS301',
    4,
    teacher1.id,
    '2024-春',
    30
  );

  // 3. 创建学生
  console.log('\n3️⃣  创建学生...');
  const student1 = await createStudent('张三', '20240001', '2024 级', '计算机科学');
  const student2 = await createStudent('李四', '20240002', '2024 级', '计算机科学');
  const student3 = await createStudent('王五', '20240003', '2024 级', '计算机科学');

  // 4. 选课
  console.log('\n4️⃣  选课...');
  await enrollStudent(student1.id, course1.id);
  await enrollStudent(student1.id, course2.id);
  await enrollStudent(student1.id, course3.id);

  await enrollStudent(student2.id, course1.id);
  await enrollStudent(student2.id, course2.id);

  await enrollStudent(student3.id, course2.id);
  await enrollStudent(student3.id, course3.id);

  // 5. 查看课程学生
  console.log('\n5️⃣  查看课程学生...');
  await getCourseWithStudents(course1.id);

  // 6. 查看学生课表
  console.log('\n6️⃣  查看学生课表...');
  await getStudentSchedule(student1.id, '2024-春');

  // 7. 录入成绩
  console.log('\n7️⃣  录入成绩...');
  const enrollment1 = await prisma.enrollment.findFirst({
    where: { studentId: student1.id, courseId: course1.id }
  });

  if (enrollment1) {
    await recordGrade(enrollment1.id, 85, 90);
  }

  const enrollment2 = await prisma.enrollment.findFirst({
    where: { studentId: student1.id, courseId: course2.id }
  });

  if (enrollment2) {
    await recordGrade(enrollment2.id, 78, 85);
  }

  const enrollment3 = await prisma.enrollment.findFirst({
    where: { studentId: student1.id, courseId: course3.id }
  });

  if (enrollment3) {
    await recordGrade(enrollment3.id, 92, 88);
  }

  // 8. 查看学生成绩
  console.log('\n8️⃣  查看学生成绩...');
  await getStudentGrades(student1.id);

  // 9. 学分统计
  console.log('\n9️⃣  学分统计...');
  await getStudentCredits(student1.id);

  // 10. 成绩分析
  console.log('\n🔟  成绩分析...');
  await analyzeCourseScores(course1.id);

  console.log('\n✅ 所有演示完成！\n');
}

// 执行演示
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
