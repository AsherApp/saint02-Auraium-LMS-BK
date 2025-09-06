import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Course = {
  id: string
  title: string
  description: string
  teacher_email: string
  status: 'draft' | 'published' | 'archived'
  visibility: 'private' | 'unlisted' | 'public'
  enrollment_policy: 'invite_only' | 'request' | 'open'
  enrollment_count?: number
  created_at: string
  updated_at: string
  published_at?: string | null
}

export type Module = {
  id: string
  course_id: string
  title: string
  description?: string
  order: number
  created_at: string
  updated_at: string
}

export type Lesson = {
  id: string
  module_id: string
  title: string
  content?: string
  order: number
  created_at: string
  updated_at: string
}

// Helper function to get user email and create headers
function getHeadersWithUserEmail() {
  const user = useAuthStore.getState().user
  const userEmail = user?.email
  if (!userEmail) {
    throw new Error('User email not available')
  }
  return {
    'x-user-email': userEmail
  }
}

// Mock data removed - using real API only

export async function listCourses(teacherEmail?: string) {
  const response = await http<{ items: Course[] }>('/api/courses')
  if (teacherEmail) {
    const filteredCourses = response.items.filter(course => course.teacher_email === teacherEmail)
    return { items: filteredCourses }
  }
  return response
}

export async function getCourse(courseId: string) {
  return await http<Course>(`/api/courses/${courseId}`)
}

export async function createCourse(data: Omit<Course, 'id' | 'created_at' | 'updated_at'>) {
  return await http<Course>('/api/courses', {
    method: 'POST',
    body: data
  })
}

export async function updateCourse(courseId: string, data: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) {
  return await http<Course>(`/api/courses/${courseId}`, {
    method: 'PUT',
    body: data
  })
}

export async function deleteCourse(courseId: string) {
  return await http<{ ok: true }>(`/api/courses/${courseId}`, {
    method: 'DELETE'
  })
}

export async function listModules(courseId: string) {
  return await http<{ items: Module[] }>(`/api/modules/course/${courseId}`)
}

export async function createModule(data: Omit<Module, 'id' | 'created_at' | 'updated_at'>) {
  return await http<Module>(`/api/modules`, {
    method: 'POST',
    body: data
  })
}

export async function updateModule(moduleId: string, data: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>) {
  return await http<Module>(`/api/modules/${moduleId}`, {
    method: 'PUT',
    body: data
  })
}

export async function deleteModule(moduleId: string) {
  return await http<{ ok: true }>(`/api/modules/${moduleId}`, {
    method: 'DELETE'
  })
}

export async function listEnrollments(courseId: string) {
  return await http<{ items: any[] }>(`/api/courses/${courseId}/roster`)
}

export async function createEnrollment(data: { course_id: string; student_email: string }) {
  return await http<{ ok: true }>('/api/enrollments', {
    method: 'POST',
    body: data
  })
}

export async function deleteEnrollment(enrollmentId: string) {
  return await http<{ ok: true }>(`/api/enrollments/${enrollmentId}`, {
    method: 'DELETE'
  })
}

