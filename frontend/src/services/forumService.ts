import apiService from './api';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    userType: 'seeker' | 'healer';
    isVerified: boolean;
    avatarUrl?: string;
  };
  isLiked: boolean;
  comments?: ForumComment[];
}

export interface ForumComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  author: {
    id: string;
    name: string;
    userType: 'seeker' | 'healer';
    isVerified: boolean;
    avatarUrl?: string;
  };
  isLiked: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface CreateCommentData {
  content: string;
}

export interface ForumPostsResponse {
  posts: ForumPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ForumService {
  async getPosts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ForumPostsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.category) queryParams.set('category', params.category);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

      const url = `/api/forum/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.request(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch forum posts');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<ForumPost> {
    try {
      const response = await apiService.request(`/api/forum/posts/${postId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch forum post');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching forum post:', error);
      throw error;
    }
  }

  async createPost(postData: CreatePostData): Promise<ForumPost> {
    try {
      const response = await apiService.request('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create forum post');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw error;
    }
  }

  async addComment(postId: string, commentData: CreateCommentData): Promise<ForumComment> {
    try {
      const response = await apiService.request(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add comment');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async togglePostLike(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await apiService.request(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle post like');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  async toggleCommentLike(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await apiService.request(`/api/forum/comments/${commentId}/like`, {
        method: 'POST',
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle comment like');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }
}

export default new ForumService();