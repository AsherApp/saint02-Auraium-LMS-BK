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

export async function getSettings(userId: string) {
  return http<UserSettings>(`/api/settings/${userId}`)
}

export async function updateSettings(userId: string, data: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  return http<UserSettings>(`/api/settings/${userId}`, { method: 'PUT', body: data })
}

export async function createSettings(data: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>) {
  return http<UserSettings>(`/api/settings`, { method: 'POST', body: data })
}

export async function upsertSettings(userId: string, data: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  try {
    // Try to update first
    return await updateSettings(userId, data)
  } catch (error: any) {
    // If settings don't exist, create them
    if (error.status === 404) {
      return await createSettings({
        user_id: userId,
        theme: data.theme || 'dark',
        notifications: data.notifications || {
          email: true,
          push: true,
          assignments: true,
          announcements: true,
          live_class: true
        },
        privacy: data.privacy || {
          profile_visible: true,
          show_email: false,
          show_bio: true
        },
        preferences: data.preferences || {
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY'
        }
      })
    }
    throw error
  }
} 