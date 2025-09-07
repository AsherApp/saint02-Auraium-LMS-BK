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
    const response = await http<{ items: Poll[] }>(`/api/polls/course/${courseId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.items
  },

  async create(data: {
    courseId: string
    question: string
    options: string[]
    lessonId?: string
    liveSessionId?: string
    allowMultipleVotes?: boolean
  }): Promise<Poll> {
    const response = await http<Poll>('/api/polls', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getById(pollId: string): Promise<Poll> {
    const response = await http<Poll>(`/api/polls/${pollId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async respond(pollId: string, selectedOptions: number[]): Promise<PollResponse> {
    const response = await http<PollResponse>(`/api/polls/${pollId}/respond`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: { selected_options: selectedOptions }
    })
    return response
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
    const response = await http<{
      poll: Poll
      totalResponses: number
      results: Array<{
        option: string
        index: number
        count: number
        percentage: number
      }>
      responses: PollResponse[]
    }>(`/api/polls/${pollId}/results`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async close(pollId: string): Promise<Poll> {
    const response = await http<Poll>(`/api/polls/${pollId}/close`, {
      method: 'POST',
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
