import { http } from '@/services/http'

export interface StudentProgress {
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
  total_assignments: number
  completed_assignments: number
  average_grade: number
  total_time_spent_hours: number
  last_activity: string | null
}

export interface StudentEngagement {
  login_frequency: number
  avg_session_duration_minutes: number
  participation_score: number
  forum_posts: number
  live_sessions_attended: number
}

export interface StudentActivity {
  id: string
  student_email: string
  course_id?: string
  activity_type: string
  description: string
  metadata: any
  created_at: string
}

export interface StudentGrade {
  id: string
  student_email: string
  course_id: string
  assignment_id?: string
  grade_type: string
  grade_percentage: number
  max_possible_score?: number
  actual_score?: number
  feedback?: string
  graded_by?: string
  graded_at: string
  created_at: string
}

export interface CourseDetails {
  student: {
    email: string
    name: string
    student_code: string
  }
  course: {
    id: string
    title: string
    description: string
    status: string
  }
  enrollment: {
    id: string
    enrolled_at: string
  }
  progress: {
    overall_percentage: number
    modules_completed: number
    total_modules: number
    lessons_completed: number
    total_lessons: number
    time_spent: number
    last_activity: string | null
  }
  grades: {
    overall_grade: number
    assignments_completed: number
    assignments_pending: number
    average_assignment_score: number
    quizzes_taken: number
    average_quiz_score: number
  }
  engagement: {
    login_frequency: number
    average_session_duration: number
    participation_score: number
    forum_posts: number
    live_sessions_attended: number
  }
  assignments: Array<{
    id: string
    title: string
    type: string
    due_date: string
    status: string
    submitted_at: string | null
    grade: number | null
    feedback: string | null
  }>
  recent_activities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    metadata: any
  }>
}

// Get student progress for a specific course
export async function getStudentProgress(studentCode: string, courseId: string): Promise<StudentProgress> {
  return http<StudentProgress>(`/api/student-progress/${encodeURIComponent(studentCode)}/course/${courseId}/progress`)
}

// Get student engagement metrics
export async function getStudentEngagement(studentCode: string, courseId: string, days: number = 30): Promise<StudentEngagement> {
  return http<StudentEngagement>(`/api/student-progress/${encodeURIComponent(studentCode)}/course/${courseId}/engagement?days=${days}`)
}

// Get general student engagement metrics (not course-specific)
export async function getGeneralStudentEngagement(studentCode: string, days: number = 30): Promise<StudentEngagement> {
  return http<StudentEngagement>(`/api/student-progress/${encodeURIComponent(studentCode)}/engagement?days=${days}`)
}

// Record student progress (lesson completion)
export async function recordStudentProgress(
  studentEmail: string, 
  courseId: string, 
  data: {
    lesson_id: string
    lesson_title: string
    time_spent_seconds?: number
    score?: number
    status?: string
  }
) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/course/${courseId}/progress`, {
    method: 'POST',
    body: data
  })
}

// Record student activity
export async function recordStudentActivity(
  studentEmail: string,
  data: {
    course_id?: string
    activity_type: string
    description: string
    metadata?: any
  }
) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/activity`, {
    method: 'POST',
    body: data
  })
}

// Record student grade
export async function recordStudentGrade(
  studentEmail: string,
  courseId: string,
  data: {
    assignment_id?: string
    grade_type: string
    grade_percentage: number
    max_possible_score?: number
    actual_score?: number
    feedback?: string
  }
) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/course/${courseId}/grade`, {
    method: 'POST',
    body: data
  })
}

// Record student attendance in live session
export async function recordStudentAttendance(
  studentEmail: string,
  sessionId: string,
  data: {
    joined_at?: string
    left_at?: string
    duration_seconds?: number
    participation_score?: number
    metadata?: any
  }
) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/live-session/${sessionId}/attendance`, {
    method: 'POST',
    body: data
  })
}

// Update student engagement for a specific date
export async function updateStudentEngagement(
  studentEmail: string,
  courseId: string,
  data: {
    date?: string
    login_count?: number
    total_session_time_seconds?: number
    lessons_completed?: number
    assignments_submitted?: number
    forum_posts?: number
    live_sessions_attended?: number
    participation_score?: number
  }
) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/course/${courseId}/engagement`, {
    method: 'POST',
    body: data
  })
}

// Get student's recent activities
export async function getStudentActivities(
  studentEmail: string,
  options: {
    limit?: number
    course_id?: string
  } = {}
): Promise<{ items: StudentActivity[] }> {
  const params = new URLSearchParams()
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.course_id) params.append('course_id', options.course_id)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return http<{ items: StudentActivity[] }>(`/api/student-progress/${encodeURIComponent(studentEmail)}/activities${query}`)
}

// Get student's grades for a course
export async function getStudentGrades(
  studentEmail: string,
  courseId: string
): Promise<{ items: StudentGrade[] }> {
  return http<{ items: StudentGrade[] }>(`/api/student-progress/${encodeURIComponent(studentEmail)}/course/${courseId}/grades`)
}

// Get consolidated student progress for all courses
export async function getConsolidatedStudentProgress(studentEmail: string) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/consolidated-progress`)
}

// Get real-time student progress updates
export async function getLiveStudentProgress(studentEmail: string) {
  return http(`/api/student-progress/${encodeURIComponent(studentEmail)}/live-progress`)
}

// Get detailed course-specific information for a student
export async function getCourseDetails(studentEmail: string, courseId: string): Promise<CourseDetails> {
  return http<CourseDetails>(`/api/students/${encodeURIComponent(studentEmail)}/course/${courseId}/details`)
}
