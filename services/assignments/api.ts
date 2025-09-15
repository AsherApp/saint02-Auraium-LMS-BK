import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

// =====================================================
// UNIFIED ASSIGNMENT API SERVICE
// =====================================================
// This service replaces all previous assignment APIs
// and provides a clean, consistent interface

export type AssignmentType = 'essay' | 'file_upload' | 'quiz' | 'project' | 'discussion' | 'presentation' | 'code_submission' | 'peer_review'

export type AssignmentScope = {
  level: 'course' | 'module' | 'lesson'
  moduleId?: string
  lessonId?: string
}

export type AssignmentSettings = {
  allow_comments: boolean
  show_grades_immediately: boolean
  anonymous_grading: boolean
  plagiarism_check: boolean
  group_assignment: boolean
  max_group_size?: number
  self_assessment: boolean
  peer_review: boolean
  peer_review_count?: number
  quiz_questions?: Array<{
    id: string
    question: string
    type: 'multiple_choice' | 'multi-select' | 'true_false' | 'short_answer'
    options?: string[]
    correctIndex?: number
    correctIndexes?: number[]
    correctAnswer?: string
    points: number
  }>
}

export type Assignment = {
  id: string
  course_id: string
  course_title?: string
  title: string
  description: string
  instructions: string
  type: AssignmentType
  scope: AssignmentScope
  points: number
  due_at: string | null
  available_from: string | null
  available_until: string | null
  allow_late_submissions: boolean
  late_penalty_percent: number
  max_attempts: number
  time_limit_minutes: number | null
  require_rubric: boolean
  rubric: any[]
  resources: any[]
  settings: AssignmentSettings
  created_at: string
  updated_at: string
  // Stats (computed)
  submission_count?: number
  graded_count?: number
  avg_grade?: number
}

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned' | 'late'

export type SubmissionContent = {
  text?: string
  essay?: string
  code?: {
    language: string
    content: string
  }
  quiz_answers?: Record<string, any>
  discussion_posts?: any[]
  presentation_slides?: string[]
  project_description?: string
  reflection?: string
  file_upload?: any[]
  peer_review?: string
}

export type Submission = {
  id?: string // Optional for simplified system
  assignment_id?: string
  student_id?: string // Student UUID for GDPR compliance
  student_email: string
  student_name?: string
  attempt_number?: number
  status: SubmissionStatus
  content?: SubmissionContent
  response?: string // For simplified system
  files?: any[] // For simplified system
  attachments?: any[]
  submitted_at: string | null
  graded_at?: string | null
  graded_by?: string | null
  grade: number | null
  feedback?: string | null
  rubric_scores?: any[]
  time_spent_minutes?: number
  late_submission?: boolean
  created_at?: string
  updated_at?: string
}

export type GradingStats = {
  total_submissions: number
  submitted_count: number
  graded_submissions: number
  pending_grading: number
  returned_submissions: number
  average_grade: number
  late_count: number
  completion_rate: number
  grading_progress: number
  grade_distribution: { [key: string]: number }
}

// Helper function to get auth headers
function getAuthHeaders() {
  const user = useAuthStore.getState().user
  if (!user?.email) {
    throw new Error('User not authenticated')
  }
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
  if (!token) {
    throw new Error('No authentication token found')
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'x-user-email': user.email,
    'x-user-role': user.role || 'student'
  }
}

// =====================================================
// ASSIGNMENT MANAGEMENT
// =====================================================

export async function listAssignments(): Promise<Assignment[]> {
  const response = await http<Assignment[]>('/api/assignments', {
    headers: getAuthHeaders()
  })
  return response
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const response = await http<Assignment>(`/api/assignments/${assignmentId}`, {
    headers: getAuthHeaders()
  })
  return response
}

export async function createAssignment(data: Partial<Assignment>): Promise<Assignment> {
  const response = await http<Assignment>('/api/assignments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

export async function updateAssignment(assignmentId: string, data: Partial<Assignment>): Promise<Assignment> {
  const response = await http<Assignment>(`/api/assignments/${assignmentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await http(`/api/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
}

export async function listCourseAssignments(courseId: string): Promise<Assignment[]> {
  const response = await http<Assignment[]>(`/api/assignments/course/${courseId}`, {
    headers: getAuthHeaders()
  })
  return response
}

export async function duplicateAssignment(assignmentId: string, newTitle: string): Promise<Assignment> {
  const response = await http<Assignment>(`/api/assignments/${assignmentId}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: newTitle })
  })
  return response
}

// =====================================================
// SUBMISSION MANAGEMENT
// =====================================================

export async function listAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  const response = await http<Submission[]>(`/api/assignments/${assignmentId}/submissions`, {
    headers: getAuthHeaders()
  })
  return response
}

export async function getSubmission(submissionId: string): Promise<Submission> {
  const response = await http<Submission>(`/api/assignments/${submissionId}`, {
    headers: getAuthHeaders()
  })
  return response
}

export async function createSubmission(assignmentId: string, data: {
  content: SubmissionContent
  attachments?: any[]
  status?: 'draft' | 'submitted'
  timeSpentMinutes?: number
}): Promise<Submission> {
  // Clean the content to remove non-serializable objects like File
  const cleanContent = { ...data.content }
  
  // Remove file_upload if it contains File objects (they can't be serialized)
  if (cleanContent.file_upload && Array.isArray(cleanContent.file_upload)) {
    // Convert File objects to a serializable format or remove them
    cleanContent.file_upload = cleanContent.file_upload.map((file: any) => {
      if (file instanceof File) {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          // Note: File content would need to be uploaded separately
        }
      }
      return file
    })
  }
  
  // Deep clean any other non-serializable objects
  const deepClean = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'function') return '[Function]'
    if (obj instanceof Date) return obj.toISOString()
    if (obj instanceof File) return { name: obj.name, size: obj.size, type: obj.type }
    if (Array.isArray(obj)) return obj.map(deepClean)
    if (typeof obj === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        try {
          cleaned[key] = deepClean(value)
        } catch (e) {
          console.warn(`Skipping non-serializable property ${key}:`, e)
        }
      }
      return cleaned
    }
    return obj
  }
  
  const finalCleanContent = deepClean(cleanContent)
  
  // Create a comprehensive response object that includes all possible fields
  // The backend will validate and extract what it needs based on assignment type
  const backendResponse: any = {
    // Text-based content
    essay: finalCleanContent.essay || '',
    project_description: finalCleanContent.project || '',
    discussion_posts: finalCleanContent.discussion || '',
    presentation_slides: finalCleanContent.presentation ? [finalCleanContent.presentation] : [],
    peer_review: finalCleanContent.peer_review || '',
    
    // File uploads
    file_upload: finalCleanContent.file_upload || [],
    
    // Quiz answers
    quiz_answers: finalCleanContent.quiz || {},
    
    // Code submission
    code: {
      language: 'javascript', // Default
      content: finalCleanContent.code_submission || ''
    }
  }
  
  // Map frontend data to backend expected format
  const submissionData = {
    response: backendResponse,
    files: deepClean(data.attachments || [])
  }
  
  // The http function will handle JSON.stringify automatically
  
  const response = await http<Submission>(`/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: submissionData
  })
  return response
}

export async function updateSubmission(submissionId: string, data: {
  content?: SubmissionContent
  attachments?: any[]
  status?: 'draft' | 'submitted'
  timeSpentMinutes?: number
}): Promise<Submission> {
  const response = await http<Submission>(`/api/assignments/${submissionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

export async function getMySubmission(assignmentId: string): Promise<Submission | null> {
  try {
    // For students, get submission data from the main assignment endpoint
    // which includes student_submission field
    const assignment = await http<any>(`/api/assignments/${assignmentId}`, {
      headers: getAuthHeaders()
    })
    return assignment.student_submission || null
  } catch (error: any) {
    if (error.message?.includes('404')) return null
    throw error
  }
}

// =====================================================
// GRADING
// =====================================================

export async function gradeSubmission(submissionId: string, data: {
  grade: number
  feedback?: string
  rubric_scores?: any[]
}): Promise<Submission> {
  const response = await http<Submission>(`/api/assignments/${submissionId}/grade`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

export async function returnSubmission(submissionId: string, feedback: string): Promise<Submission> {
  const response = await http<Submission>(`/api/assignments/${submissionId}/return`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: { feedback }
  })
  return response
}

export async function getGradingStats(assignmentId: string): Promise<GradingStats> {
  const response = await http<GradingStats>(`/api/assignments/${assignmentId}/grading-stats`, {
    headers: getAuthHeaders()
  })
  return response
}

// =====================================================
// FILE UPLOAD
// =====================================================

export async function uploadFile(file: File, type: 'assignment_resource' | 'submission_attachment'): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await http<any>('/api/upload', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      // Don't set Content-Type for FormData
    },
    body: formData
  })
  return response
}

// =====================================================
// ANALYTICS
// =====================================================

export async function getAssignmentAnalytics(assignmentId: string): Promise<{
  completion_rate: number
  average_time_spent: number
  difficulty_rating: number
  common_mistakes: string[]
  improvement_suggestions: string[]
}> {
  const response = await http(`/api/assignments/${assignmentId}/analytics`, {
    headers: getAuthHeaders()
  })
  return response
}

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

export const AssignmentAPI = {
  // Assignment Management
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listCourseAssignments,
  duplicateAssignment,
  
  // Submission Management
  listAssignmentSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  getMySubmission,
  
  // Grading
  gradeSubmission,
  returnSubmission,
  getGradingStats,
  
  // File Upload
  uploadFile,
  
  // Analytics
  getAssignmentAnalytics
}

export default AssignmentAPI
