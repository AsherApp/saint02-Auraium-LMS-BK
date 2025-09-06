import { http } from "../http"

// Professional Assignment Types
export type AssignmentType = 'essay' | 'file_upload' | 'quiz' | 'project' | 'discussion' | 'presentation' | 'code_submission' | 'peer_review'

export type AssignmentScope = {
  level: 'course' | 'module' | 'lesson'
  moduleId?: string
  lessonId?: string
}

export type RubricCriteria = {
  id: string
  name: string
  description: string
  maxPoints: number
  levels: {
    level: number
    description: string
    points: number
  }[]
}

export type Assignment = {
  id: string
  course_id: string
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
  rubric: RubricCriteria[]
  resources: AssignmentResource[]
  settings: AssignmentSettings
  created_at: string
  updated_at: string
  submission_count?: number
  graded_count?: number
  avg_grade?: number
}

export type AssignmentResource = {
  id: string
  name: string
  type: 'file' | 'link' | 'video' | 'document'
  url: string
  description?: string
  size?: number
  mime_type?: string
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
}

export type Submission = {
  id: string
  assignment_id: string
  student_email: string
  student_name: string
  attempt_number: number
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'late'
  content: SubmissionContent
  attachments: AttachmentFile[]
  submitted_at: string | null
  graded_at: string | null
  graded_by: string | null
  grade: number | null
  feedback: string | null
  rubric_scores: RubricScore[]
  time_spent_minutes: number
  late_submission: boolean
  created_at: string
  updated_at: string
}

export type SubmissionContent = {
  text?: string
  essay?: string
  code?: {
    language: string
    content: string
  }
  quiz_answers?: Record<string, any>
  discussion_posts?: {
    id: string
    content: string
    created_at: string
  }[]
  presentation_slides?: string[]
  project_description?: string
  reflection?: string
}

export type AttachmentFile = {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

export type RubricScore = {
  criteria_id: string
  level: number
  points: number
  comment?: string
}

export type AssignmentTemplate = {
  id: string
  name: string
  description: string
  type: AssignmentType
  template_data: Partial<Assignment>
  category: 'academic' | 'creative' | 'technical' | 'assessment'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_time_hours: number
}

export type GradingStats = {
  total_submissions: number
  graded_submissions: number
  pending_grading: number
  average_grade: number
  grade_distribution: {
    'A (90-100)': number
    'B (80-89)': number  
    'C (70-79)': number
    'D (60-69)': number
    'F (0-59)': number
    'Not Graded': number
  }
  submission_timeline: {
    date: string
    count: number
  }[]
  late_submissions: number
  on_time_submissions: number
}

// API Functions
export class AssignmentProAPI {
  // Assignment Management
  static async createAssignment(data: any): Promise<Assignment> {
    return await http<Assignment>('/api/assignments', {
      method: 'POST',
      body: data
    })
  }

  static async getAssignment(assignmentId: string): Promise<Assignment> {
    const response = await http<any>(`/api/assignments/${assignmentId}`)
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      course_id: response.courseId,
      title: response.title,
      description: response.description,
      instructions: response.instructions,
      type: response.type,
      scope: response.scope,
      points: response.points,
      due_at: response.dueAt,
      available_from: response.availableFrom,
      available_until: response.availableUntil,
      allow_late_submissions: response.allowLateSubmissions,
      late_penalty_percent: response.latePenaltyPercent,
      max_attempts: response.maxAttempts,
      time_limit_minutes: response.timeLimitMinutes,
      require_rubric: response.requireRubric,
      rubric: response.rubric,
      resources: response.resources,
      settings: response.settings,
      created_at: response.createdAt,
      updated_at: response.updatedAt,
      submission_count: response.submissionCount,
      graded_count: response.gradedCount,
      avg_grade: response.avgGrade
    }
  }

  static async updateAssignment(assignmentId: string, data: Partial<Assignment>): Promise<Assignment> {
    return await http<Assignment>(`/api/assignments/${assignmentId}`, {
      method: 'PUT',
      body: data
    })
  }

  static async deleteAssignment(assignmentId: string): Promise<void> {
    await http(`/api/assignments/${assignmentId}`, {
      method: 'DELETE'
    })
  }

  static async listCourseAssignments(courseId: string): Promise<Assignment[]> {
    const response = await http<{ items: any[] }>(`/api/courses/${courseId}/assignments`)
    
    // Transform backend response to match frontend type
    return (response.items || []).map(item => ({
      id: item.id,
      course_id: item.course_id,
      title: item.title,
      description: item.description || '',
      instructions: item.instructions || '',
      type: item.type,
      scope: item.scope,
      points: item.points || 100,
      due_at: item.due_at,
      available_from: item.available_from,
      available_until: item.available_until,
      allow_late_submissions: item.allow_late_submissions || false,
      late_penalty_percent: item.late_penalty_percent || 0,
      max_attempts: item.max_attempts || 1,
      time_limit_minutes: item.time_limit_minutes,
      require_rubric: item.require_rubric || false,
      rubric: item.rubric || [],
      resources: item.resources || [],
      settings: item.settings || {
        allow_comments: true,
        show_grades_immediately: false,
        anonymous_grading: false,
        plagiarism_check: false,
        group_assignment: false,
        self_assessment: false,
        peer_review: false
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    }))
  }

  static async duplicateAssignment(assignmentId: string, newTitle: string): Promise<Assignment> {
    return await http<Assignment>(`/api/assignments/${assignmentId}/duplicate`, {
      method: 'POST',
      body: { title: newTitle }
    })
  }

  // Submission Management
  static async submitAssignment(assignmentId: string, data: {
    content: SubmissionContent
    attachments: AttachmentFile[]
    attempt_number?: number
  }): Promise<Submission> {
    const response = await http<any>(`/api/submissions/assignment/${assignmentId}`, {
      method: 'POST',
      body: {
        ...data,
        status: 'submitted'
      }
    })
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      assignment_id: response.assignmentId,
      student_email: response.studentEmail,
      student_name: response.studentName,
      attempt_number: response.attemptNumber,
      status: response.status,
      content: response.content,
      attachments: response.attachments,
      submitted_at: response.submittedAt,
      graded_at: response.gradedAt,
      graded_by: response.gradedBy,
      grade: response.grade,
      feedback: response.feedback,
      rubric_scores: response.rubricScores,
      time_spent_minutes: response.timeSpentMinutes,
      late_submission: response.lateSubmission,
      created_at: response.createdAt,
      updated_at: response.updatedAt
    }
  }

  static async saveSubmissionDraft(assignmentId: string, data: {
    content: SubmissionContent
    attachments: AttachmentFile[]
  }): Promise<Submission> {
    const response = await http<any>(`/api/submissions/assignment/${assignmentId}`, {
      method: 'POST',
      body: {
        ...data,
        status: 'draft'
      }
    })
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      assignment_id: response.assignmentId,
      student_email: response.studentEmail,
      student_name: response.studentName,
      attempt_number: response.attemptNumber,
      status: response.status,
      content: response.content,
      attachments: response.attachments,
      submitted_at: response.submittedAt,
      graded_at: response.gradedAt,
      graded_by: response.gradedBy,
      grade: response.grade,
      feedback: response.feedback,
      rubric_scores: response.rubricScores,
      time_spent_minutes: response.timeSpentMinutes,
      late_submission: response.lateSubmission,
      created_at: response.createdAt,
      updated_at: response.updatedAt
    }
  }

  static async getSubmission(assignmentId: string, studentEmail?: string): Promise<Submission | null> {
    try {
      const response = await http<any[]>(`/api/submissions/assignment/${assignmentId}`)
      
      if (!response || response.length === 0) return null
      
      // Get the latest submission
      const latestSubmission = response[0]
      
      // Transform backend response to match frontend type
      return {
        id: latestSubmission.id,
        assignment_id: latestSubmission.assignmentId,
        student_email: latestSubmission.studentEmail,
        student_name: latestSubmission.studentName,
        attempt_number: latestSubmission.attemptNumber,
        status: latestSubmission.status,
        content: latestSubmission.content,
        attachments: latestSubmission.attachments,
        submitted_at: latestSubmission.submittedAt,
        graded_at: latestSubmission.gradedAt,
        graded_by: latestSubmission.gradedBy,
        grade: latestSubmission.grade,
        feedback: latestSubmission.feedback,
        rubric_scores: latestSubmission.rubricScores,
        time_spent_minutes: latestSubmission.timeSpentMinutes,
        late_submission: latestSubmission.lateSubmission,
        created_at: latestSubmission.createdAt,
        updated_at: latestSubmission.updatedAt
      }
    } catch (error: any) {
      if (error.message?.includes('404')) return null
      throw error
    }
  }



  // Student submission methods
  static async getStudentSubmissions(assignmentId: string): Promise<Submission[]> {
    const response = await http<any[]>(`/api/submissions/assignment/${assignmentId}`)
    
    // Transform backend response to match frontend type
    return response.map(item => ({
      id: item.id,
      assignment_id: item.assignmentId,
      student_email: item.studentEmail,
      student_name: item.studentName,
      attempt_number: item.attemptNumber,
      status: item.status,
      content: item.content,
      attachments: item.attachments,
      submitted_at: item.submittedAt,
      graded_at: item.gradedAt,
      graded_by: item.gradedBy,
      grade: item.grade,
      feedback: item.feedback,
      rubric_scores: item.rubricScores,
      time_spent_minutes: item.timeSpentMinutes,
      late_submission: item.lateSubmission,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }))
  }

  static async createSubmission(assignmentId: string, data: {
    content: any
    attachments?: AttachmentFile[]
    status?: 'draft' | 'submitted'
    timeSpentMinutes?: number
  }): Promise<Submission> {
    const response = await http<any>(`/api/submissions/assignment/${assignmentId}`, {
      method: 'POST',
      body: data
    })
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      assignment_id: response.assignmentId,
      student_email: response.studentEmail,
      student_name: response.studentName,
      attempt_number: response.attemptNumber,
      status: response.status,
      content: response.content,
      attachments: response.attachments,
      submitted_at: response.submittedAt,
      graded_at: response.gradedAt,
      graded_by: response.gradedBy,
      grade: response.grade,
      feedback: response.feedback,
      rubric_scores: response.rubricScores,
      time_spent_minutes: response.timeSpentMinutes,
      late_submission: response.lateSubmission,
      created_at: response.createdAt,
      updated_at: response.updatedAt
    }
  }

  static async updateSubmission(submissionId: string, data: {
    content?: any
    attachments?: AttachmentFile[]
    status?: 'draft' | 'submitted'
    timeSpentMinutes?: number
  }): Promise<Submission> {
    const response = await http<any>(`/api/submissions/${submissionId}`, {
      method: 'PUT',
      body: data
    })
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      assignment_id: response.assignmentId,
      student_email: response.studentEmail,
      student_name: response.studentName,
      attempt_number: response.attemptNumber,
      status: response.status,
      content: response.content,
      attachments: response.attachments,
      submitted_at: response.submittedAt,
      graded_at: response.gradedAt,
      graded_by: response.gradedBy,
      grade: response.grade,
      feedback: response.feedback,
      rubric_scores: response.rubricScores,
      time_spent_minutes: response.timeSpentMinutes,
      late_submission: response.lateSubmission,
      created_at: response.createdAt,
      updated_at: response.updatedAt
    }
  }

  static async getSubmissionById(submissionId: string): Promise<Submission> {
    const response = await http<any>(`/api/submissions/${submissionId}`)
    
    // Transform backend response to match frontend type
    return {
      id: response.id,
      assignment_id: response.assignmentId,
      student_email: response.studentEmail,
      student_name: response.studentName,
      attempt_number: response.attemptNumber,
      status: response.status,
      content: response.content,
      attachments: response.attachments,
      submitted_at: response.submittedAt,
      graded_at: response.gradedAt,
      graded_by: response.gradedBy,
      grade: response.grade,
      feedback: response.feedback,
      rubric_scores: response.rubricScores,
      time_spent_minutes: response.timeSpentMinutes,
      late_submission: response.lateSubmission,
      created_at: response.createdAt,
      updated_at: response.updatedAt
    }
  }

  static async listAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
    const response = await http<any[]>(`/api/assignments/${assignmentId}/submissions`)
    
    return response.map(submission => ({
      id: submission.id,
      assignment_id: submission.assignmentId,
      student_email: submission.studentEmail,
      student_name: submission.studentName,
      attempt_number: submission.attemptNumber,
      status: submission.status,
      content: submission.content,
      attachments: submission.attachments,
      submitted_at: submission.submittedAt,
      graded_at: submission.gradedAt,
      graded_by: submission.gradedBy,
      grade: submission.grade,
      feedback: submission.feedback,
      rubric_scores: submission.rubricScores,
      time_spent_minutes: submission.timeSpentMinutes,
      late_submission: submission.lateSubmission,
      created_at: submission.createdAt,
      updated_at: submission.updatedAt
    }))
  }

  static async getMyAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
    const response = await http<any[]>(`/api/submissions/assignment/${assignmentId}`)
    
    return response.map(submission => ({
      id: submission.id,
      assignment_id: submission.assignmentId,
      student_email: submission.studentEmail,
      student_name: submission.studentName,
      attempt_number: submission.attemptNumber,
      status: submission.status,
      content: submission.content,
      attachments: submission.attachments,
      submitted_at: submission.submittedAt,
      graded_at: submission.gradedAt,
      graded_by: submission.gradedBy,
      grade: submission.grade,
      feedback: submission.feedback,
      rubric_scores: submission.rubricScores,
      time_spent_minutes: submission.timeSpentMinutes,
      late_submission: submission.lateSubmission,
      created_at: submission.createdAt,
      updated_at: submission.updatedAt
    }))
  }

  // Grading
  static async gradeSubmission(submissionId: string, data: {
    grade: number
    feedback?: string
    rubric_scores?: RubricScore[]
  }): Promise<Submission> {
    return await http<Submission>(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: data
    })
  }

  static async bulkGrade(assignmentId: string, grades: {
    submission_id: string
    grade: number
    feedback?: string
  }[]): Promise<void> {
    await http(`/api/assignments/${assignmentId}/bulk-grade`, {
      method: 'POST',
      body: { grades }
    })
  }

  static async getGradingStats(assignmentId: string): Promise<GradingStats> {
    return await http<GradingStats>(`/api/assignments/${assignmentId}/grading-stats`)
  }

  // Templates
  static async getAssignmentTemplates(): Promise<AssignmentTemplate[]> {
    const response = await http<{ items: AssignmentTemplate[] }>('/api/assignment-templates')
    return response.items
  }

  static async createFromTemplate(templateId: string, courseId: string, customizations: Partial<Assignment>): Promise<Assignment> {
    return await http<Assignment>('/api/assignments/from-template', {
      method: 'POST',
      body: {
        template_id: templateId,
        course_id: courseId,
        ...customizations
      }
    })
  }

  // File Upload
  static async uploadFile(file: File, type: 'assignment_resource' | 'submission_attachment'): Promise<AttachmentFile> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return await http<AttachmentFile>('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}  // Let browser set Content-Type for FormData
    })
  }

  // Analytics
  static async getAssignmentAnalytics(assignmentId: string): Promise<{
    completion_rate: number
    average_time_spent: number
    difficulty_rating: number
    common_mistakes: string[]
    improvement_suggestions: string[]
  }> {
    return await http(`/api/assignments/${assignmentId}/analytics`)
  }
}

export default AssignmentProAPI