import { httpClient } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Message = {
  id: string
  from_email: string
  to_email: string
  subject: string
  content: string
  priority: 'low' | 'normal' | 'high'
  read: boolean
  starred: boolean
  archived: boolean
  thread_id?: string
  parent_id?: string
  attachments?: any[]
  created_at: string
  updated_at: string
}

export type MessageResponse = {
  items: Message[]
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

export async function getMessages() {
  return http<MessageResponse>('/api/messages', {
    headers: getHeadersWithUserEmail()
  })
}

export async function getUnreadCount() {
  return http<{ count: number }>('/api/messages/unread-count', {
    headers: getHeadersWithUserEmail()
  })
}

export async function sendMessage(data: {
  to_email: string
  subject: string
  content: string
  priority?: 'low' | 'normal' | 'high'
  attachments?: any[]
  thread_id?: string
  parent_id?: string
}) {
  return http<Message>('/api/messages', {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function markMessageAsRead(messageId: string) {
  return http<Message>(`/api/messages/${messageId}/read`, {
    method: 'PUT',
    headers: getHeadersWithUserEmail()
  })
}

export async function deleteMessage(messageId: string) {
  return http<{ success: boolean }>(`/api/messages/${messageId}`, {
    method: 'DELETE',
    headers: getHeadersWithUserEmail()
  })
}

export async function getConversation(otherEmail: string) {
  return http<MessageResponse>(`/api/messages/conversation/${otherEmail}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function toggleMessageStar(messageId: string) {
  return http<Message>(`/api/messages/${messageId}/star`, {
    method: 'PUT',
    headers: getHeadersWithUserEmail()
  })
}

export async function toggleMessageArchive(messageId: string) {
  return http<Message>(`/api/messages/${messageId}/archive`, {
    method: 'PUT',
    headers: getHeadersWithUserEmail()
  })
}

export async function bulkActionMessages(messageIds: string[], action: 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'unarchive') {
  return http<{ updated: number }>('/api/messages/bulk-action', {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { message_ids: messageIds, action }
  })
}

export async function searchMessages(params: {
  q?: string
  filter?: 'all' | 'unread' | 'starred' | 'archived'
  sort_by?: 'date' | 'sender' | 'subject' | 'priority'
}) {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.filter) searchParams.append('filter', params.filter)
  if (params.sort_by) searchParams.append('sort_by', params.sort_by)
  
  return http<MessageResponse>(`/api/messages/search?${searchParams.toString()}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function getMessageStats() {
  return http<{
    total: number
    unread: number
    starred: number
    archived: number
  }>('/api/messages/stats', {
    headers: getHeadersWithUserEmail()
  })
} 