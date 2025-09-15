import { http } from '../http'

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned' | 'late'

export type Submission = {
  id: string
  assignment_id: string
  student_id: string
  student_email: string
  student_name?: string
  content?: any
  response?: string
  status: SubmissionStatus
  attempt_number: number
  grade?: number | null
  feedback?: string
  submitted_at?: string
  graded_at?: string
  graded_by?: string
  created_at: string
  updated_at: string
  // Additional fields from joins
  assignment_title?: string
  assignment_points?: number
  assignment_type?: string
}

export type CreateSubmissionData = {
  assignment_id: string
  content?: any
  response?: string
}

export type UpdateSubmissionData = {
  content?: any
  response?: string
}

export type GradeSubmissionData = {
  grade: number
  feedback?: string
  requestResubmission?: boolean
}

// Get submissions for an assignment (teachers only)
export async function getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  const response = await http<Submission[]>(`/api/submissions/assignment/${assignmentId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return response
}

// Get single submission
export async function getSubmission(submissionId: string): Promise<Submission> {
  const response = await http<Submission>(`/api/submissions/${submissionId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return response
}

// Create new submission
export async function createSubmission(data: CreateSubmissionData): Promise<Submission> {
  const response = await http<Submission>('/api/submissions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Update submission (for resubmissions)
export async function updateSubmission(submissionId: string, data: UpdateSubmissionData): Promise<Submission> {
  const response = await http<Submission>(`/api/submissions/${submissionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Grade submission (teachers only)
export async function gradeSubmission(submissionId: string, data: GradeSubmissionData): Promise<{ message: string; submission: Submission }> {
  const response = await http<{ message: string; submission: Submission }>(`/api/submissions/${submissionId}/grade`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Delete submission
export async function deleteSubmission(submissionId: string): Promise<{ message: string }> {
  const response = await http<{ message: string }>(`/api/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return response
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

// Export all functions
export const SubmissionsAPI = {
  getAssignmentSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  gradeSubmission,
  deleteSubmission
}
