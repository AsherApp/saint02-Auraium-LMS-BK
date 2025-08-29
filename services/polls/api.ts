import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Poll = {
  id: string
  courseId: string
  question: string
  options: string[]
  createdBy: string
  isActive: boolean
  createdAt: string
}

export type PollResponse = {
  id: string
  pollId: string
  studentEmail: string
  selectedOption: number
  respondedAt: string
}

const getHeadersWithUserEmail = () => {
  const { user } = useAuthStore.getState()
  return {
    'x-user-email': user?.email || '',
    'x-user-role': user?.role || ''
  }
}

export const PollsService = {
  async getByCourse(courseId: string): Promise<Poll[]> {
    const response = await http.get(`/polls/course/${courseId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data.items
  },

  async create(data: {
    courseId: string
    question: string
    options: string[]
    lessonId?: string
    liveSessionId?: string
    allowMultipleVotes?: boolean
  }): Promise<Poll> {
    const response = await http.post('/polls', data, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async getById(pollId: string): Promise<Poll> {
    const response = await http.get(`/polls/${pollId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async respond(pollId: string, selectedOptions: number[]): Promise<PollResponse> {
    const response = await http.post(`/polls/${pollId}/respond`, { selected_options: selectedOptions }, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async getResults(pollId: string): Promise<{
    poll: Poll
    totalResponses: number
    results: Array<{
      option: string
      index: number
      count: number
      percentage: number
    }>
    responses: PollResponse[]
  }> {
    const response = await http.get(`/polls/${pollId}/results`, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  },

  async close(pollId: string): Promise<Poll> {
    const response = await http.post(`/polls/${pollId}/close`, {}, {
      headers: getHeadersWithUserEmail()
    })
    return response.data
  }
}
