import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned' | 'late'

export type Submission = {
  id: string
  assignmentId: string
  studentEmail: string
  studentName: string
  attemptNumber: number
  status: SubmissionStatus
  content: any
  attachments: any[]
  submittedAt: string | null
  gradedAt: string | null
  gradedBy: string | null
  grade: number | null
  feedback: string | null
  rubricScores: any
  timeSpentMinutes: number
  lateSubmission: boolean
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

export const SubmissionsService = {
  async getByAssignment(assignmentId: string): Promise<Submission[]> {
    const response = await http<Submission[]>(`/api/submissions/assignment/${assignmentId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async create(assignmentId: string, data: {
    content: any
    status?: SubmissionStatus
    attachments?: any[]
    timeSpentMinutes?: number
  }): Promise<Submission> {
    const response = await http<Submission>(`/api/submissions/assignment/${assignmentId}`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async update(submissionId: string, data: {
    content?: any
    status?: SubmissionStatus
    attachments?: any[]
    timeSpentMinutes?: number
  }): Promise<Submission> {
    const response = await http<Submission>(`/api/submissions/${submissionId}`, {
      method: 'PUT',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getById(submissionId: string): Promise<Submission> {
    const response = await http<Submission>(`/api/submissions/${submissionId}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
