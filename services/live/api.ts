import { httpClient } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type LiveSession = {
  id: string
  courseId?: string
  moduleId?: string
  title: string
  description?: string
  startAt: number
  endAt?: number
  status: "scheduled" | "active" | "ended"
  hostEmail: string
  participants: string[]
  sessionType: "course" | "module" | "general"
  isStarted?: boolean
  startedAt?: number
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

export async function getMyLiveSessions(userEmail: string, userRole: string) {
  return http<{ items: LiveSession[] }>(`/api/live/my-sessions`, {
    headers: { 
      'x-user-email': userEmail,
      'x-user-role': userRole
    }
  })
}

export async function createLiveSession(data: {
  course_id?: string
  module_id?: string
  title: string
  description?: string
  start_at: number
  session_type: "course" | "module" | "general"
}) {
  return http<LiveSession>(`/api/live`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function updateSessionStatus(id: string, status: "scheduled" | "active" | "ended") {
  return http<LiveSession>(`/api/live/${id}/status`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { status }
  })
}

export async function startLiveSession(id: string) {
  return http<LiveSession>(`/api/live/${id}/start`, {
    method: 'POST',
    headers: getHeadersWithUserEmail()
  })
}

export async function endLiveSession(id: string) {
  return http<LiveSession>(`/api/live/${id}/end`, {
    method: 'POST',
    headers: getHeadersWithUserEmail()
  })
}

export async function addLiveMessage(sessionId: string, text: string) {
  return http(`/api/live/${sessionId}/messages`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { text }
  })
}

export async function addLiveResource(sessionId: string, title: string, url?: string) {
  return http(`/api/live/${sessionId}/resources`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { title, url }
  })
}

