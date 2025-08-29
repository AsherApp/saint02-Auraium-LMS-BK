import { http } from '../http'

export type Module = {
  id: string
  course_id: string
  title: string
  description: string
  position: number
  created_at?: string
}

export type CreateModuleData = {
  course_id: string
  title: string
  description?: string
}

export type UpdateModuleData = Partial<CreateModuleData>

// Mock data removed - using real API only

export async function getModulesByCourse(courseId: string) {
  return await http<{ items: Module[] }>(`/api/modules/course/${courseId}`)
}

export async function getModule(moduleId: string) {
  return await http<Module>(`/api/modules/${moduleId}`)
}

export async function createModule(data: CreateModuleData) {
  return await http<Module>('/api/modules', {
    method: 'POST',
    body: data
  })
}

export async function updateModule(moduleId: string, data: UpdateModuleData) {
  return await http<Module>(`/api/modules/${moduleId}`, {
    method: 'PUT',
    body: data
  })
}

export async function deleteModule(moduleId: string) {
  return await http(`/api/modules/${moduleId}`, {
    method: 'DELETE'
  })
} 