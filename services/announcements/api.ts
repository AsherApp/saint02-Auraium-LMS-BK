import { http } from "../http"

export type Announcement = {
  id: string
  teacher_email: string
  message: string
  created_at: string
  updated_at: string
}

export async function getAnnouncements() {
  return http<{ items: Announcement[] }>(`/api/announcements`)
}

export async function createAnnouncement(data: { message: string }) {
  return http<Announcement>(`/api/announcements`, {
    method: 'POST',
    body: data
  })
} 