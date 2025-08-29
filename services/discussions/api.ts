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
    const response = await http.get(`/discussions/course/${courseId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data.items
  },

  async create(data: {
    courseId: string
    title: string
    description?: string
  }): Promise<Discussion> {
    const response = await http.post('/discussions', data, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async getById(discussionId: string): Promise<Discussion> {
    const response = await http.get(`/discussions/${discussionId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async createPost(discussionId: string, data: {
    content: string
    parentPostId?: string
  }): Promise<DiscussionPost> {
    const response = await http.post(`/discussions/${discussionId}/posts`, data, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async approvePost(postId: string): Promise<DiscussionPost> {
    const response = await http.post(`/discussions/posts/${postId}/approve`, {}, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async deletePost(postId: string): Promise<void> {
    await http.delete(`/discussions/posts/${postId}`, {
      headers: getHeadersWithUserEmail()
    })
  },

  async getStats(discussionId: string): Promise<{
    totalPosts: number
    totalParticipants: number
    recentActivity: any[]
  }> {
    const response = await http.get(`/discussions/${discussionId}/stats`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  }
}
