import { http } from '../http'

export interface AssignmentSubmission {
  submitted_at: string
  response: string
  files: string[]
  status: 'submitted' | 'graded'
  grade?: number
  feedback?: string
  graded_at?: string
  graded_by?: string
}

export interface Assignment {
  // Essential fields
  id: string
  course_id: string
  title: string
  student_responses: Record<string, AssignmentSubmission>
  
  // Important fields
  description?: string
  instructions?: string
  type: string
  points: number
  due_at?: string
  is_published: boolean
  
  // Settings fields (JSONB objects)
  scope?: {
    level: string
    [key: string]: any
  }
  rubric: any[]
  resources: any[]
  settings: {
    peer_review?: boolean
    allow_comments?: boolean
    max_group_size?: number
    self_assessment?: boolean
    group_assignment?: boolean
    plagiarism_check?: boolean
    anonymous_grading?: boolean
    peer_review_count?: number
    show_grades_immediately?: boolean
    [key: string]: any
  }
  
  // Constraint fields
  available_from?: string
  available_until?: string
  allow_late_submissions: boolean
  late_penalty_percent: number
  max_attempts: number
  time_limit_minutes?: number
  
  // Metadata fields
  created_at: string
  updated_at: string
  status: string
  module_id?: string
  lesson_id?: string
  require_rubric: boolean
  
  // Frontend computed fields
  student_submission?: AssignmentSubmission
  is_submitted?: boolean
  is_graded?: boolean
  is_available?: boolean
  is_overdue?: boolean
  is_late?: boolean
  time_remaining?: number
}

export interface AssignmentDetails {
  assignment: Assignment
  student_submissions: Array<{
    student_email: string
    student_name: string
    submission: AssignmentSubmission | null
    is_submitted: boolean
    is_graded: boolean
  }>
  total_students: number
  submitted_count: number
  graded_count: number
}

export const SimplifiedAssignmentsAPI = {
  // Get assignments for a course
  getCourseAssignments: async (courseId: string): Promise<Assignment[]> => {
    console.log('DEBUG: Fetching simplified assignments for course:', courseId)
    const response = await http<Assignment[]>(`/api/assignments/simplified/course/${courseId}`)
    console.log('DEBUG: Simplified assignments response:', response)
    return response || []
  },

  // Submit assignment
  submitAssignment: async (assignmentId: string, data: {
    response: string
    files?: string[]
  }): Promise<{ success: boolean; message: string; submission: AssignmentSubmission }> => {
    return await http(`/api/assignments/simplified/${assignmentId}/submit`, {
      method: 'POST',
      body: data
    })
  },

  // Grade assignment (teacher)
  gradeAssignment: async (assignmentId: string, data: {
    studentEmail: string
    grade: number
    feedback?: string
  }): Promise<{ success: boolean; message: string; grade: AssignmentSubmission }> => {
    return await http(`/api/assignments/simplified/${assignmentId}/grade`, {
      method: 'PUT',
      body: data
    })
  },

  // Get assignment details with all submissions (teacher)
  getAssignmentDetails: async (assignmentId: string): Promise<AssignmentDetails> => {
    return await http(`/api/assignments/simplified/${assignmentId}/details`)
  }
}

export default SimplifiedAssignmentsAPI
