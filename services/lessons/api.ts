import { http } from '../http'
import { useAuthStore } from "@/store/auth-store"

export type Lesson = {
  id: string
  module_id: string
  title: string
  type: 'video' | 'quiz' | 'file' | 'discussion' | 'poll'
  description: string
  content: any
  position: number
  created_at?: string
}

export type CreateLessonData = {
  module_id: string
  title: string
  type: 'video' | 'quiz' | 'file' | 'discussion' | 'poll'
  description?: string
  content?: any
}

export type UpdateLessonData = Partial<CreateLessonData>

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

export async function getLessonsByModule(moduleId: string) {
  return await http<{ items: Lesson[] }>(`/api/lessons/module/${moduleId}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function getLesson(lessonId: string) {
  return await http<Lesson>(`/api/lessons/${lessonId}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function createLesson(data: CreateLessonData) {
  return await http<Lesson>('/api/lessons', {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function updateLesson(lessonId: string, data: UpdateLessonData) {
  return await http<Lesson>(`/api/lessons/${lessonId}`, {
    method: 'PUT',
    body: data
  })
}

export async function deleteLesson(lessonId: string) {
  return await http(`/api/lessons/${lessonId}`, {
    method: 'DELETE'
  })
}

export async function updateLessonContent(lessonId: string, content: any) {
  return await http<Lesson>(`/api/lessons/${lessonId}/content`, {
    method: 'PUT',
    body: { content }
  })
} 