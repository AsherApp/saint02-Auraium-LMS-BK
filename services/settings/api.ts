import { http } from '../http'

export type UserSettings = {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    assignments: boolean
    announcements: boolean
    live_class: boolean
  }
  privacy: {
    profile_visible: boolean
    show_email: boolean
    show_bio: boolean
  }
  preferences: {
    language: string
    timezone: string
    date_format: string
  }
  created_at: string
  updated_at: string
}

export type TeacherSettings = {
  id?: string
  user_id?: string
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    assignments: boolean
    announcements: boolean
    live_class: boolean
    student_questions: boolean
    course_announcements: boolean
    live_session_reminders: boolean
  }
  privacy: {
    profile_visibility: string
    show_email_to_students: boolean
    allow_student_messages: boolean
  }
  preferences: {
    language: string
    timezone: string
    date_format: string
  }
  course_settings: {
    default_course_duration: number
    auto_publish_courses: boolean
    allow_student_discussions: boolean
  }
  grading_settings: {
    default_grading_scale: string
    allow_late_submissions: boolean
    late_submission_penalty: number
    auto_grade_quizzes: boolean
  }
  live_class_settings: {
    default_session_duration: number
    allow_recording: boolean
    require_approval_to_join: boolean
    max_participants: number
  }
  advanced_settings: {
    data_export_enabled: boolean
    analytics_tracking: boolean
    beta_features: boolean
  }
  created_at?: string
  updated_at?: string
}

export async function getSettings(userId: string, userRole: 'teacher' | 'student' = 'student') {
  if (userRole === 'teacher') {
    return http<TeacherSettings>(`/api/settings/${userId}`)
  } else {
    return http<UserSettings>(`/api/settings/student/${userId}`)
  }
}

export async function updateSettings(userId: string, data: Partial<TeacherSettings | UserSettings>, userRole: 'teacher' | 'student' = 'student') {
  if (userRole === 'teacher') {
    return http<TeacherSettings>(`/api/settings/${userId}`, { method: 'PUT', body: data })
  } else {
    return http<UserSettings>(`/api/settings/student/${userId}`, { method: 'PUT', body: data })
  }
}

export async function createSettings(data: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>, userRole: 'teacher' | 'student' = 'student') {
  if (userRole === 'teacher') {
    return http<TeacherSettings>(`/api/settings`, { method: 'POST', body: data })
  } else {
    return http<UserSettings>(`/api/settings/student`, { method: 'POST', body: data })
  }
}

export async function upsertSettings(userId: string, data: Partial<TeacherSettings | UserSettings>, userRole: 'teacher' | 'student' = 'student') {
  try {
    // Try to update first
    return await updateSettings(userId, data, userRole)
  } catch (error: any) {
    // If settings don't exist, create them
    if (error.status === 404) {
      if (userRole === 'teacher') {
        return await createSettings({
          user_id: userId,
          theme: (data as TeacherSettings).theme || 'dark',
          notifications: (data as TeacherSettings).notifications || {
            email: true,
            push: true,
            assignments: true,
            announcements: true,
            live_class: true,
            student_questions: true,
            course_announcements: true,
            live_session_reminders: true
          },
          privacy: (data as TeacherSettings).privacy || {
            profile_visibility: 'public',
            show_email_to_students: false,
            allow_student_messages: true
          },
          preferences: (data as TeacherSettings).preferences || {
            language: 'en',
            timezone: 'UTC',
            date_format: 'MM/DD/YYYY'
          },
          course_settings: (data as TeacherSettings).course_settings || {
            default_course_duration: 60,
            auto_publish_courses: false,
            allow_student_discussions: true
          },
          grading_settings: (data as TeacherSettings).grading_settings || {
            default_grading_scale: 'percentage',
            allow_late_submissions: true,
            late_submission_penalty: 10,
            auto_grade_quizzes: true
          },
          live_class_settings: (data as TeacherSettings).live_class_settings || {
            default_session_duration: 60,
            allow_recording: true,
            require_approval_to_join: false,
            max_participants: 50
          },
          advanced_settings: (data as TeacherSettings).advanced_settings || {
            data_export_enabled: true,
            analytics_tracking: true,
            beta_features: false
          }
        } as any, userRole)
      } else {
        return await createSettings({
          user_id: userId,
          theme: (data as UserSettings).theme || 'dark',
          notifications: (data as UserSettings).notifications || {
            email: true,
            push: true,
            assignments: true,
            announcements: true,
            live_class: true
          },
          privacy: (data as UserSettings).privacy || {
            profile_visible: true,
            show_email: false,
            show_bio: true
          },
          preferences: (data as UserSettings).preferences || {
            language: 'en',
            timezone: 'UTC',
            date_format: 'MM/DD/YYYY'
          }
        } as any, userRole)
      }
    }
    throw error
  }
} 