"use client"
import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSettings, upsertSettings, type UserSettings } from './api'

export function useSettingsFn(userId: string) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const settingsData = await getSettings(userId)
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
  }, [userId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const update = useCallback(async (data: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!userId) throw new Error("No user ID")
    
    setError(null)
    try {
      const updatedSettings = await upsertSettings(userId, data)
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err: any) {
      setError(err.message || "Failed to update settings")
      throw err
    }
  }, [userId])

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    update,
  }
} 