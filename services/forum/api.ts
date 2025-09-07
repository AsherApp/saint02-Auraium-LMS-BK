import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type ForumCategory = {
  id: string
  name: string
  description?: string
  isActive: boolean
  postCount: number
  lastActivity?: string
}

export type ForumPost = {
  id: string
  categoryId: string
  title: string
  content: string
  authorEmail: string
  authorName: string
  isPinned: boolean
  isLocked: boolean
  replyCount: number
  viewCount: number
  lastReplyAt?: string
  createdAt: string
  updatedAt: string
}

export type ForumReply = {
  id: string
  postId: string
  content: string
  authorEmail: string
  authorName: string
  createdAt: string
  updatedAt: string
}

const getHeadersWithUserEmail = () => {
  const { user } = useAuthStore.getState()
  return {
    'x-user-email': user?.email || '',
    'x-user-role': user?.role || ''
  }
}

export const ForumService = {
  async getCategories(): Promise<ForumCategory[]> {
    const response = await http<{ items: ForumCategory[] }>('/api/forum/categories', {
      headers: getHeadersWithUserEmail()
    })
    return response.items
  },

  async getPosts(categoryId?: string, page = 1, limit = 20): Promise<{
    posts: ForumPost[]
    totalCount: number
    totalPages: number
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    if (categoryId) params.append('categoryId', categoryId)
    
    const response = await http<{
      posts: ForumPost[]
      totalCount: number
      totalPages: number
    }>(`/api/forum/posts?${params}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async createPost(data: {
    categoryId: string
    title: string
    content: string
  }): Promise<ForumPost> {
    const response = await http<ForumPost>('/api/forum/posts', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getPost(postId: string): Promise<ForumPost> {
    const response = await http<ForumPost>(`/api/forum/posts/${postId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async getReplies(postId: string, page = 1, limit = 20): Promise<{
    replies: ForumReply[]
    totalCount: number
    totalPages: number
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    const response = await http<{
      replies: ForumReply[]
      totalCount: number
      totalPages: number
    }>(`/api/forum/posts/${postId}/replies?${params}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async createReply(postId: string, content: string): Promise<ForumReply> {
    const response = await http<ForumReply>(`/api/forum/posts/${postId}/replies`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: { content }
    })
    return response
  },

  async togglePin(postId: string): Promise<ForumPost> {
    const response = await http<ForumPost>(`/api/forum/posts/${postId}/pin`, {
      method: 'PATCH',
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async toggleLock(postId: string): Promise<ForumPost> {
    const response = await http<ForumPost>(`/api/forum/posts/${postId}/lock`, {
      method: 'PATCH',
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
