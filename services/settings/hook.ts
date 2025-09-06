"use client"
import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSettings, upsertSettings, type UserSettings, type TeacherSettings } from './api'

export function useSettingsFn(userId: string, userRole: 'teacher' | 'student' = 'student') {
  const [settings, setSettings] = useState<UserSettings | TeacherSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const settingsData = await getSettings(userId, userRole)
      setSettings(settingsData)
    } catch (err: any) {
      if (err.status === 404) {
        // Settings don't exist yet, that's okay
        setSettings(null)
      } else {
        setError(err.message || "Failed to fetch settings")
        setSettings(null)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const update = useCallback(async (data: Partial<Omit<UserSettings | TeacherSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!userId) throw new Error("No user ID")
    
    setError(null)
    try {
      const updatedSettings = await upsertSettings(userId, data, userRole)
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err: any) {
      setError(err.message || "Failed to update settings")
      throw err
    }
  }, [userId, userRole])

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    update,
  }
} 