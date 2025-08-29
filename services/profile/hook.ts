"use client"
import { useState, useEffect, useCallback } from 'react'
import { getProfile, updateProfile, upsertProfile, type Profile } from './api'

export function useProfileFn(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const profileData = await getProfile(userId)
      setProfile(profileData)
    } catch (err: any) {
      if (err.status === 404) {
        // Profile doesn't exist yet, that's okay
        setProfile(null)
      } else {
        setError(err.message || "Failed to fetch profile")
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const update = useCallback(async (data: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!userId) throw new Error("No user ID")
    
    setError(null)
    try {
      const updatedProfile = await upsertProfile(userId, data)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
      throw err
    }
  }, [userId])

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    update,
  }
} 