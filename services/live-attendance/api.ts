import { http } from '../http'

export interface LiveAttendanceRecord {
  id: string
  session_id: string
  student_email: string
  check_in_time: string
  check_out_time?: string
  total_duration_seconds: number
  attendance_percentage: number
  status: 'present' | 'late' | 'absent' | 'excused' | 'left_early'
  late_minutes: number
  early_leave_minutes: number
  participation_activities: number
  engagement_score: number
  teacher_notes?: string
  student_notes?: string
  created_at: string
  updated_at: string
  students?: {
    name: string
    email: string
  }
}

export interface LiveParticipant {
  id: string
  session_id: string
  email: string
  role: 'host' | 'student' | 'guest'
  joined_at: string
  left_at?: string
  duration_seconds: number
  attendance_status: 'present' | 'late' | 'absent' | 'excused'
  participation_score: number
  notes?: string
  device_info?: any
  connection_quality?: 'excellent' | 'good' | 'fair' | 'poor'
  created_at: string
  updated_at: string
}

export interface LiveAttendanceReport {
  id: string
  session_id: string
  total_enrolled_students: number
  present_count: number
  late_count: number
  absent_count: number
  excused_count: number
  average_attendance_percentage: number
  average_participation_score: number
  average_engagement_score: number
  session_duration_minutes: number
  generated_at: string
  created_at: string
}

export interface LiveAttendanceSettings {
  id: string
  course_id: string
  teacher_email: string
  late_threshold_minutes: number
  absence_threshold_minutes: number
  minimum_attendance_percentage: number
  auto_mark_absent: boolean
  require_checkout: boolean
  participation_tracking: boolean
  attendance_notes_required: boolean
  created_at: string
  updated_at: string
}

export interface SessionAttendance {
  attendance_records: LiveAttendanceRecord[]
  participants: LiveParticipant[]
  report: LiveAttendanceReport | null
}

// ===== ATTENDANCE MANAGEMENT API =====

// Get attendance for a live session
export async function getSessionAttendance(sessionId: string) {
  return http<SessionAttendance>(`/api/live-attendance/session/${sessionId}`)
}

// Mark attendance for a student
export async function markAttendance(sessionId: string, data: {
  student_email: string
  status: LiveAttendanceRecord['status']
  notes?: string
  participation_score?: number
  engagement_score?: number
}) {
  return http<LiveAttendanceRecord>(`/api/live-attendance/session/${sessionId}/mark`, {
    method: 'POST',
    body: data
  })
}

// Bulk mark attendance for multiple students
export async function bulkMarkAttendance(sessionId: string, attendanceData: Array<{
  student_email: string
  status: LiveAttendanceRecord['status']
  notes?: string
  participation_score?: number
  engagement_score?: number
}>) {
  return http<{ updated_records: LiveAttendanceRecord[] }>(`/api/live-attendance/session/${sessionId}/bulk-mark`, {
    method: 'POST',
    body: { attendance_data: attendanceData }
  })
}

// Student check-in to live session
export async function checkInToSession(sessionId: string) {
  return http<LiveAttendanceRecord>(`/api/live-attendance/session/${sessionId}/check-in`, {
    method: 'POST'
  })
}

// Student check-out from live session
export async function checkOutFromSession(sessionId: string, notes?: string) {
  return http<LiveAttendanceRecord>(`/api/live-attendance/session/${sessionId}/check-out`, {
    method: 'POST',
    body: { notes }
  })
}

// Get attendance settings for a course
export async function getAttendanceSettings(courseId: string) {
  return http<LiveAttendanceSettings>(`/api/live-attendance/settings/${courseId}`)
}

// Update attendance settings for a course
export async function updateAttendanceSettings(courseId: string, data: Partial<LiveAttendanceSettings>) {
  return http<LiveAttendanceSettings>(`/api/live-attendance/settings/${courseId}`, {
    method: 'PUT',
    body: data
  })
}

// Generate attendance report for a session
export async function generateAttendanceReport(sessionId: string) {
  return http<LiveAttendanceReport>(`/api/live-attendance/session/${sessionId}/report`, {
    method: 'POST'
  })
}

// Get attendance history for a student
export async function getStudentAttendanceHistory(studentEmail: string, params?: {
  course_id?: string
  start_date?: string
  end_date?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.course_id) searchParams.append('course_id', params.course_id)
  if (params?.start_date) searchParams.append('start_date', params.start_date)
  if (params?.end_date) searchParams.append('end_date', params.end_date)

  return http<{ items: LiveAttendanceRecord[] }>(`/api/live-attendance/student/${studentEmail}/history?${searchParams.toString()}`)
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

// Helper function to get attendance status color
export function getAttendanceStatusColor(status: LiveAttendanceRecord['status']): string {
  switch (status) {
    case 'present':
      return 'text-green-500'
    case 'late':
      return 'text-yellow-500'
    case 'absent':
      return 'text-red-500'
    case 'excused':
      return 'text-blue-500'
    case 'left_early':
      return 'text-orange-500'
    default:
      return 'text-gray-500'
  }
}

// Helper function to get attendance status badge color
export function getAttendanceStatusBadgeColor(status: LiveAttendanceRecord['status']): string {
  switch (status) {
    case 'present':
      return 'bg-green-600'
    case 'late':
      return 'bg-yellow-600'
    case 'absent':
      return 'bg-red-600'
    case 'excused':
      return 'bg-blue-600'
    case 'left_early':
      return 'bg-orange-600'
    default:
      return 'bg-gray-600'
  }
}
