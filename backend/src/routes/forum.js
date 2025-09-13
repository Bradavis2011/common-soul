const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Helper functions
async function checkUserLikedPost(postId, userId) {
  if (!userId) return false;
  const like = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId, userId } }
  });
  return !!like;
}

async function checkUserLikedComment(commentId, userId) {
  if (!userId) return false;
  const like = await prisma.forumCommentLike.findUnique({
    where: { commentId_userId: { commentId, userId } }
  });
  return !!like;
}

// Get all forum posts with pagination and filtering
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isHidden: false,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        author: {
          include: {
            profile: {
              include: {
                healerProfile: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: { where: { isHidden: false } },
            likes: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    });

    const totalPosts = await prisma.forumPost.count({ where });
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Format posts for frontend
    const formattedPosts = await Promise.all(posts.map(async post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags ? JSON.parse(post.tags) : [],
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post.viewsCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.profile ? 
          `${post.author.profile.firstName} ${post.author.profile.lastName}` : 
          'Anonymous',
        userType: post.author.userType,
        isVerified: post.author.userType === 'healer' && post.author.profile?.healerProfile?.isVerified,
        avatarUrl: post.author.profile?.avatarUrl
      },
      isLiked: req.user ? await checkUserLikedPost(post.id, req.user.id) : false
    })));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch forum posts',
      error: error.message 
    });
  }
});

// Get a specific forum post with comments
router.get('/posts/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId, isHidden: false },
      include: {
        author: {
          include: {
            profile: {
              include: {
                healerProfile: true
              }
            }
          }
        },
        comments: {
          where: { isHidden: false },
          include: {
            author: {
              include: {
                profile: true,
                healerProfile: true
              }
            },
            _count: {
              select: { likes: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { isHidden: false } }
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Forum post not found' 
      });
    }

    // Increment view count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    });

    // Format comments
    const formattedComments = await Promise.all(
      post.comments.map(async (comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        likesCount: comment._count.likes,
        author: {
          id: comment.author.id,
          name: comment.author.profile ? 
            `${comment.author.profile.firstName} ${comment.author.profile.lastName}` : 
            'Anonymous',
          userType: comment.author.userType,
          isVerified: comment.author.userType === 'healer' && comment.author.profile?.healerProfile?.isVerified,
          avatarUrl: comment.author.profile?.avatarUrl
        },
        isLiked: req.user ? await checkUserLikedComment(comment.id, req.user.id) : false
      }))
    );

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags ? JSON.parse(post.tags) : [],
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post.viewsCount + 1, // Include the increment
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.profile ? 
          `${post.author.profile.firstName} ${post.author.profile.lastName}` : 
          'Anonymous',
        userType: post.author.userType,
        isVerified: post.author.userType === 'healer' && post.author.profile?.healerProfile?.isVerified,
        avatarUrl: post.author.profile?.avatarUrl
      },
      isLiked: req.user ? await checkUserLikedPost(post.id, req.user.id) : false,
      comments: formattedComments
    };

    res.json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('Error fetching forum post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch forum post',
      error: error.message 
    });
  }
});

// Create a new forum post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const authorId = req.user.id;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    const post = await prisma.forumPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags && Array.isArray(tags) ? JSON.stringify(tags) : null,
        authorId
      },
      include: {
        author: {
          include: {
            profile: true,
            healerProfile: true
          }
        }
      }
    });

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags ? JSON.parse(post.tags) : [],
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: post.viewsCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.profile ? 
          `${post.author.profile.firstName} ${post.author.profile.lastName}` : 
          'Anonymous',
        userType: post.author.userType,
        isVerified: post.author.userType === 'healer' && post.author.profile?.healerProfile?.isVerified,
        avatarUrl: post.author.profile?.avatarUrl
      },
      isLiked: false,
      comments: []
    };

    res.status(201).json({
      success: true,
      data: formattedPost,
      message: 'Forum post created successfully'
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create forum post',
      error: error.message 
    });
  }
});

// Add a comment to a forum post
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Check if post exists and is not locked
    const post = await prisma.forumPost.findUnique({
      where: { id: postId, isHidden: false }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    if (post.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on a locked post'
      });
    }

    const comment = await prisma.forumComment.create({
      data: {
        content: content.trim(),
        postId,
        authorId
      },
      include: {
        author: {
          include: {
            profile: true,
            healerProfile: true
          }
        }
      }
    });

    // Update comment count on post
    await prisma.forumPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    });

    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount: 0,
      author: {
        id: comment.author.id,
        name: comment.author.profile ? 
          `${comment.author.profile.firstName} ${comment.author.profile.lastName}` : 
          'Anonymous',
        userType: comment.author.userType,
        isVerified: comment.author.userType === 'healer' && comment.author.healerProfile?.isVerified,
        avatarUrl: comment.author.profile?.avatarUrl
      },
      isLiked: false
    };

    res.status(201).json({
      success: true,
      data: formattedComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create comment',
      error: error.message 
    });
  }
});

// Toggle like on a forum post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId, isHidden: false }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Forum post not found'
      });
    }

    // Check if user already liked this post
    const existingLike = await prisma.forumPostLike.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    let isLiked = false;
    let likesCount = post.likesCount;

    if (existingLike) {
      // Unlike the post
      await prisma.forumPostLike.delete({
        where: { id: existingLike.id }
      });
      likesCount = Math.max(0, likesCount - 1);
      await prisma.forumPost.update({
        where: { id: postId },
        data: { likesCount }
      });
    } else {
      // Like the post
      await prisma.forumPostLike.create({
        data: { postId, userId }
      });
      likesCount += 1;
      isLiked = true;
      await prisma.forumPost.update({
        where: { id: postId },
        data: { likesCount }
      });
    }

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount
      },
      message: isLiked ? 'Post liked' : 'Post unliked'
    });
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle post like',
      error: error.message 
    });
  }
});

// Toggle like on a forum comment
router.post('/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId, isHidden: false }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked this comment
    const existingLike = await prisma.forumCommentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId }
      }
    });

    let isLiked = false;
    let likesCount = comment.likesCount;

    if (existingLike) {
      // Unlike the comment
      await prisma.forumCommentLike.delete({
        where: { id: existingLike.id }
      });
      likesCount = Math.max(0, likesCount - 1);
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { likesCount }
      });
    } else {
      // Like the comment
      await prisma.forumCommentLike.create({
        data: { commentId, userId }
      });
      likesCount += 1;
      isLiked = true;
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { likesCount }
      });
    }

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount
      },
      message: isLiked ? 'Comment liked' : 'Comment unliked'
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle comment like',
      error: error.message 
    });
  }
});

module.exports = router;