import { http } from '../http'
import { useAuthStore } from "@/store/auth-store"

export type Note = {
  id: string
  user_email: string
  course_id?: string
  lesson_id?: string
  title: string
  content: string
  tags?: string[]
  is_public: boolean
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

export async function listNotes(userId: string, filters?: { course_id?: string; lesson_id?: string; is_public?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.course_id) params.append('course_id', filters.course_id)
  if (filters?.lesson_id) params.append('lesson_id', filters.lesson_id)
  if (filters?.is_public !== undefined) params.append('is_public', filters.is_public.toString())
  
  const query = params.toString()
  const url = query ? `/api/notes?${query}` : '/api/notes'
  return http<{ items: Note[] }>(url, {
    headers: getHeadersWithUserEmail()
  })
}

export async function getNote(id: string) {
  return http<Note>(`/api/notes/${id}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function createNote(data: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
  return http<Note>(`/api/notes`, { 
    method: 'POST', 
    headers: getHeadersWithUserEmail(),
    body: data 
  })
}

export async function updateNote(id: string, data: Partial<Omit<Note, 'id' | 'user_email' | 'created_at' | 'updated_at'>>) {
  return http<Note>(`/api/notes/${id}`, { 
    method: 'PUT', 
    headers: getHeadersWithUserEmail(),
    body: data 
  })
}

export async function deleteNote(id: string) {
  return http<{ ok: true }>(`/api/notes/${id}`, { 
    method: 'DELETE',
    headers: getHeadersWithUserEmail()
  })
}

export async function searchNotes(userId: string, query: string) {
  return http<{ items: Note[] }>(`/api/notes/search?q=${encodeURIComponent(query)}`, {
    headers: getHeadersWithUserEmail()
  })
} 