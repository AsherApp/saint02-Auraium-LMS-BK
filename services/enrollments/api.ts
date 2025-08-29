import { http } from '../http'

export async function getRoster(courseId: string) {
  return http<{ items: { course_id: string; email: string; name: string; state: 'active'|'pending'; invite_code?: string; invited_at?: string }[] }>(`/api/courses/${courseId}/roster`)
}

export async function enroll(courseId: string, student_email: string) {
  return http<{ ok: true }>(`/api/courses/${courseId}/enroll`, { method: 'POST', body: { student_email } })
}

