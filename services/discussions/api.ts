import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Discussion = {
  id: string
  courseId: string
  title: string
  description?: string
  createdBy: string
  isActive: boolean
  createdAt: string
}

export type DiscussionPost = {
  id: string
  discussionId: string
  authorEmail: string
  content: string
  parentPostId?: string
  isApproved: boolean
  createdAt: string
}

const getHeadersWithUserEmail = () => {
  const { user } = useAuthStore.getState()
  return {
    'x-user-email': user?.email || '',
    'x-user-role': user?.role || ''
  }
}

export const DiscussionsService = {
  async getByCourse(courseId: string): Promise<Discussion[]> {
    const response = await http<{ items: Discussion[] }>(`/api/discussions/course/${courseId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.items
  },

  async create(data: {
    courseId: string
    title: string
    description?: string
  }): Promise<Discussion> {
    const response = await http<Discussion>('/api/discussions', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getById(discussionId: string): Promise<Discussion> {
    const response = await http<Discussion>(`/api/discussions/${discussionId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async createPost(discussionId: string, data: {
    content: string
    parentPostId?: string
  }): Promise<DiscussionPost> {
    const response = await http<DiscussionPost>(`/api/discussions/${discussionId}/posts`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async approvePost(postId: string): Promise<DiscussionPost> {
    const response = await http<DiscussionPost>(`/api/discussions/posts/${postId}/approve`, {
      method: 'POST',
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async deletePost(postId: string): Promise<void> {
    await http(`/api/discussions/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeadersWithUserEmail()
    })
  },

  async getStats(discussionId: string): Promise<{
    totalPosts: number
    totalParticipants: number
    recentActivity: any[]
  }> {
    const response = await http<{
      totalPosts: number
      totalParticipants: number
      recentActivity: any[]
    }>(`/api/discussions/${discussionId}/stats`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
