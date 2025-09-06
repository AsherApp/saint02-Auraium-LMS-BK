import { httpClient } from "../http"
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
    const response = await httpClient.get('/forum/categories', getHeadersWithUserEmail())
    return response.data.items
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
    
    const response = await httpClient.get(`/forum/posts?${params}`, getHeadersWithUserEmail())
    return response.data
  },

  async createPost(data: {
    categoryId: string
    title: string
    content: string
  }): Promise<ForumPost> {
    const response = await httpClient.post('/forum/posts', data, getHeadersWithUserEmail())
    return response.data
  },

  async getPost(postId: string): Promise<ForumPost> {
    const response = await httpClient.get(`/forum/posts/${postId}`, getHeadersWithUserEmail())
    return response.data
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
    
    const response = await httpClient.get(`/forum/posts/${postId}/replies?${params}`, getHeadersWithUserEmail())
    return response.data
  },

  async createReply(postId: string, content: string): Promise<ForumReply> {
    const response = await httpClient.post(`/forum/posts/${postId}/replies`, { content }, getHeadersWithUserEmail())
    return response.data
  },

  async togglePin(postId: string): Promise<ForumPost> {
    const response = await httpClient.patch(`/forum/posts/${postId}/pin`, {}, getHeadersWithUserEmail())
    return response.data
  },

  async toggleLock(postId: string): Promise<ForumPost> {
    const response = await httpClient.patch(`/forum/posts/${postId}/lock`, {}, getHeadersWithUserEmail())
    return response.data
  }
}
