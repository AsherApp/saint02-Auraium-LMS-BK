import { http } from '../http'

export type Profile = {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  bio?: string
  preferences?: any
  created_at: string
  updated_at: string
}

export async function getProfile(userId: string) {
  return http<Profile>(`/api/profiles/${userId}`)
}

export async function updateProfile(userId: string, data: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  return http<Profile>(`/api/profiles/${userId}`, { method: 'PUT', body: data })
}

export async function createProfile(data: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) {
  return http<Profile>(`/api/profiles`, { method: 'POST', body: data })
}

export async function upsertProfile(userId: string, data: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  try {
    // Try to update first
    return await updateProfile(userId, data)
  } catch (error: any) {
    // If profile doesn't exist, create it
    if (error.status === 404) {
      return await createProfile({
        user_id: userId,
        name: data.name || '',
        avatar_url: data.avatar_url,
        bio: data.bio,
        preferences: data.preferences
      })
    }
    throw error
  }
} 