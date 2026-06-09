/**
 * postgresql + Prisma 示例：博客系统
 * 
 * 📖 学习目标：
 * 完成本案例后，你应该能够：
 * 1. ✅ 配置 postgresql 环境
 * 2. ✅ 使用 Prisma orm
 * 3. ✅ 文章/分类/标签管理
 * 4. ✅ 生产环境配置
 * 
 * ⚠️ 注意事项：
 * - 需要运行 postgresql 数据库
 * - 配置 DATABASE_URL 环境变量
 * - 先执行 prisma migrate
 * - 参考 POSTGRES_PRISMA_GUIDE 文档
 * 
 * 📝 练习任务：
 * - 文章/分类/标签管理
 * - 实现分页查询
 * - 处理一对多关系
 * 
 * 🔗 相关文档：
 * - docs/POSTGRES_PRISMA_GUIDE/00-README.md - 总索引
 * - docs/POSTGRES_PRISMA_GUIDE/01-GETTING_STARTED.md - 环境搭建
 * - docs/11-ELYSIA_PRISMA_INTEGRATION.md - 集成指南
 * 
 * 运行：bun run examples/08-postgres-prisma/blog-system.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 分类管理 ====================
async function createCategory(name: string, slug: string, parentId?: number) {
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parent: parentId ? { connect: { id: parentId } } : undefined
    },
    include: {
      parent: true
    }
  });

  console.log('✅ 创建分类:', category.name);
  return category;
}

async function getCategoryTree() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true
        }
      },
      _count: {
        select: { posts: true }
      }
    }
  });

  console.log('📁 分类树:');
  console.log(JSON.stringify(categories, null, 2));
  return categories;
}

// ==================== 标签管理 ====================
async function createTags(names: string[]) {
  const tags = await Promise.all(
    names.map(name => 
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  console.log('🏷️  创建标签:', tags.map(t => t.name));
  return tags;
}

// ==================== 文章管理 ====================

// 创建文章
async function createPost(
  title: string,
  content: string,
  authorId: number,
  categoryId: number,
  tagNames: string[]
) {
  const post = await prisma.post.create({
    data: {
      title,
      content,
      status: 'PUBLISHED',
      author: { connect: { id: authorId } },
      category: { connect: { id: categoryId } },
      tags: {
        connectOrCreate: tagNames.map(name => ({
          where: { name },
          create: { name }
        }))
      }
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: true,
      tags: true
    }
  });

  console.log('✅ 创建文章:', post.title);
  return post;
}

// 获取单篇文章（包含所有关联）
async function getPostById(id: number) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      category: {
        include: { parent: true }
      },
      tags: true,
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } }
        }
      },
      _count: {
        select: { likes: true }
      }
    }
  });

  console.log('📄 文章详情:', post?.title);
  return post;
}

// 分页查询文章
async function getPosts(
  page: number = 1,
  limit: number = 10,
  filters?: {
    categoryId?: number;
    tagId?: number;
    authorId?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    search?: string;
  }
) {
  const where: Prisma.PostWhereInput = {};

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.tagId) {
    where.tags = { some: { id: filters.tagId } };
  }

  if (filters?.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.or = [
      { title: { contains: filters.search } },
      { content: { contains: filters.search } }
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: true,
        _count: {
          select: { comments: true, likes: true }
        }
      }
    }),
    prisma.post.count({ where })
  ]);

  console.log(`📚 分页查询：第${page}页，共${Math.ceil(total / limit)}页，总计${total}篇`);
  
  return {
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// 更新文章
async function updatePost(id: number, data: {
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: number;
  tagNames?: string[];
}) {
  const updateData: Prisma.PostUpdateInput = {};

  if (data.title) updateData.title = data.title;
  if (data.content) updateData.content = data.content;
  if (data.status) updateData.status = data.status;
  if (data.categoryId) {
    updateData.category = { connect: { id: data.categoryId } };
  }

  if (data.tagNames) {
    const existingTags = await prisma.tag.findMany({
      where: { name: { in: data.tagNames } }
    });

    const newTagNames = data.tagNames.filter(
      name => !existingTags.some(tag => tag.name === name)
    );

    updateData.tags = {
      set: existingTags.map(tag => ({ id: tag.id })),
      connectOrCreate: newTagNames.map(name => ({
        where: { name },
        create: { name }
      }))
    };
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: {
      tags: true,
      category: true
    }
  });

  console.log('✏️  更新文章:', post.title);
  return post;
}

// 删除文章
async function deletePost(id: number) {
  await prisma.post.delete({
    where: { id }
  });

  console.log('🗑️  删除文章 id:', id);
}

// ==================== 评论系统 ====================

async function addComment(
  postId: number,
  authorId: number,
  content: string,
  parentId?: number
) {
  const comment = await prisma.comment.create({
    data: {
      content,
      post: { connect: { id: postId } },
      author: { connect: { id: authorId } },
      parent: parentId ? { connect: { id: parentId } } : undefined
    },
    include: {
      author: { select: { name: true } },
      replies: {
        include: {
          author: { select: { name: true } }
        }
      }
    }
  });

  console.log('💬 添加评论:', content.substring(0, 30) + '...');
  return comment;
}

async function getPostComments(postId: number) {
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { likes: true }
      }
    }
  });

  console.log(`💬 文章评论：${comments.length}条`);
  return comments;
}

// ==================== 点赞功能 ====================

async function toggleLike(postId: number, userId: number) {
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId
      }
    }
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    console.log('👎 取消点赞');
    return false;
  } else {
    await prisma.like.create({
      data: { postId, userId }
    });
    console.log('👍 点赞成功');
    return true;
  }
}

// ==================== 文章统计 ====================

async function getPostStats() {
  const stats = await prisma.post.groupBy({
    by: ['status'],
    _count: true,
    _avg: {
      views: true
    }
  });

  const totalPosts = await prisma.post.count();
  const totalViews = await prisma.post.aggregate({
    _sum: { views: true }
  });

  console.log('📊 文章统计:');
  console.log('总文章数:', totalPosts);
  console.log('总浏览量:', totalViews._sum.views || 0);
  console.log('按状态分布:', stats);

  return {
    totalPosts,
    totalViews: totalViews._sum.views || 0,
    byStatus: stats
  };
}

// ==================== 热门文章查询 ====================

async function getPopularPosts(limit: number = 5) {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [
      { likes: { _count: 'desc' } },
      { views: 'desc' }
    ],
    take: limit,
    include: {
      author: { select: { name: true } },
      tags: true,
      _count: {
        select: { comments: true, likes: true }
      }
    }
  });

  console.log('🔥 热门文章 Top', limit);
  return posts;
}

// ==================== 主函数：演示流程 ====================

async function main() {
  console.log('🚀 postgresql + Prisma 博客系统演示\n');

  // 1. 创建分类
  console.log('1️⃣  创建分类...');
  const tech = await createCategory('技术', 'tech');
  const life = await createCategory('生活', 'life');
  const frontend = await createCategory('前端', 'frontend', tech.id);

  // 2. 创建标签
  console.log('\n2️⃣  创建标签...');
  await createTags(['typescript', 'Prisma', 'postgresql', '博客', '教程']);

  // 3. 创建测试用户
  console.log('\n3️⃣  创建用户...');
  const author = await prisma.user.create({
    data: {
      email: 'author@example.com',
      name: '博主',
      password: 'hashed_password',
      role: 'ADMIN'
    }
  });

  // 4. 创建文章
  console.log('\n4️⃣  创建文章...');
  const post1 = await createPost(
    'Prisma 完全教程',
    '这是一篇详细的 Prisma 教程，包含所有核心概念...',
    author.id,
    frontend.id,
    ['typescript', 'Prisma', '教程']
  );

  const post2 = await createPost(
    'postgresql 性能优化',
    'postgresql 数据库性能优化技巧大全...',
    author.id,
    tech.id,
    ['postgresql', '教程']
  );

  // 5. 添加评论
  console.log('\n5️⃣  添加评论...');
  const comment1 = await addComment(post1.id, author.id, '写得很好！👍');
  const comment2 = await addComment(post1.id, author.id, '感谢分享', comment1.id);

  // 6. 分页查询
  console.log('\n6️⃣  分页查询...');
  const page1 = await getPosts(1, 10, { status: 'PUBLISHED' });

  // 7. 获取文章详情
  console.log('\n7️⃣  获取文章详情...');
  await getPostById(post1.id);

  // 8. 获取评论列表
  console.log('\n8️⃣  获取评论...');
  await getPostComments(post1.id);

  // 9. 点赞
  console.log('\n9️⃣  点赞...');
  await toggleLike(post1.id, author.id);
  await toggleLike(post1.id, author.id); // 再次点击取消

  // 10. 文章统计
  console.log('\n🔟  统计信息...');
  await getPostStats();

  // 11. 热门文章
  console.log('\n1️⃣1️⃣  热门文章...');
  await getPopularPosts(3);

  // 12. 分类树
  console.log('\n1️⃣2️⃣  分类树...');
  await getCategoryTree();

  console.log('\n✅ 所有演示完成！\n');
}

// 执行演示
main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
