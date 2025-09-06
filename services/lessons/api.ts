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

// No mock data - return empty results when API fails
const mockLessons: Lesson[] = []

export async function getLessonsByModule(moduleId: string) {
  try {
    return await http<{ items: Lesson[] }>(`/api/lessons/module/${moduleId}`, {
      headers: getHeadersWithUserEmail()
    })
  } catch (error) {
    // Fallback to mock data
    const moduleLessons = mockLessons.filter(lesson => lesson.module_id === moduleId)
    return { items: moduleLessons }
  }
}

export async function getLesson(lessonId: string) {
  try {
    return await http<Lesson>(`/api/lessons/${lessonId}`, {
      headers: getHeadersWithUserEmail()
    })
  } catch (error) {
    // Fallback to mock data
    const lesson = mockLessons.find(l => l.id === lessonId)
    if (lesson) return lesson
    throw new Error('Lesson not found')
  }
}

export async function createLesson(data: CreateLessonData) {
  try {
    return await http<Lesson>('/api/lessons', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      module_id: data.module_id,
      title: data.title,
      type: data.type,
      description: data.description || '',
      content: data.content || null,
      position: 0
    }
    mockLessons.push(newLesson)
    return newLesson
  }
}

export async function updateLesson(lessonId: string, data: UpdateLessonData) {
  try {
    return await http<Lesson>(`/api/lessons/${lessonId}`, {
      method: 'PUT',
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const lessonIndex = mockLessons.findIndex(l => l.id === lessonId)
    if (lessonIndex === -1) throw new Error('Lesson not found')
    
    mockLessons[lessonIndex] = {
      ...mockLessons[lessonIndex],
      ...data
    }
    return mockLessons[lessonIndex]
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    return await http(`/api/lessons/${lessonId}`, {
      method: 'DELETE'
    })
  } catch (error) {
    // Fallback to mock data
    const lessonIndex = mockLessons.findIndex(l => l.id === lessonId)
    if (lessonIndex === -1) throw new Error('Lesson not found')
    
    mockLessons.splice(lessonIndex, 1)
    return { success: true }
  }
}

export async function updateLessonContent(lessonId: string, content: any) {
  try {
    return await http<Lesson>(`/api/lessons/${lessonId}/content`, {
      method: 'PUT',
      body: { content }
    })
  } catch (error) {
    // Fallback to mock data
    const lessonIndex = mockLessons.findIndex(l => l.id === lessonId)
    if (lessonIndex === -1) throw new Error('Lesson not found')
    
    mockLessons[lessonIndex] = {
      ...mockLessons[lessonIndex],
      content
    }
    return mockLessons[lessonIndex]
  }
} 