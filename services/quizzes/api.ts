import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type QuizQuestion = {
  id: number
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options?: string[]
  correct_answer?: number | string
  points: number
}

export type Quiz = {
  id: string
  courseId: string
  title: string
  description?: string
  questions: QuizQuestion[]
  timeLimitMinutes?: number
  maxAttempts: number
  isPublished: boolean
  createdAt: string
}

export type QuizResponse = {
  id: string
  quizId: string
  studentEmail: string
  answers: Record<string, any>
  score?: number
  timeTakenMinutes?: number
  submittedAt: string
}

const getHeadersWithUserEmail = () => {
  const { user } = useAuthStore.getState()
  return {
    'x-user-email': user?.email || '',
    'x-user-role': user?.role || ''
  }
}

export const QuizzesService = {
  async getByCourse(courseId: string): Promise<Quiz[]> {
    const response = await http<{ items: Quiz[] }>(`/api/quizzes/course/${courseId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.items
  },

  async create(data: {
    courseId: string
    title: string
    description?: string
    questions: QuizQuestion[]
    timeLimitMinutes?: number
    maxAttempts?: number
  }): Promise<Quiz> {
    const response = await http<Quiz>('/api/quizzes', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getById(quizId: string): Promise<Quiz> {
    const response = await http<Quiz>(`/api/quizzes/${quizId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async respond(quizId: string, answers: Record<string, any>): Promise<QuizResponse> {
    const response = await http<QuizResponse>(`/api/quizzes/${quizId}/respond`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: { answers }
    })
    return response
  },

  async getResults(quizId: string): Promise<{
    quiz: Quiz
    responses: QuizResponse[]
    stats: any
  }> {
    const response = await http<{
      quiz: Quiz
      responses: QuizResponse[]
      stats: any
    }>(`/api/quizzes/${quizId}/results`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async close(quizId: string): Promise<Quiz> {
    const response = await http<Quiz>(`/api/quizzes/${quizId}/close`, {
      method: 'POST',
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
