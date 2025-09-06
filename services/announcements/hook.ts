"use client"

import { useState, useEffect } from "react"
import { getAnnouncements, createAnnouncement } from "./api"
import type { Announcement } from "./api"

export function useAnnouncementsFn() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAnnouncements()
      setAnnouncements(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch announcements")
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const postAnnouncement = async (message: string) => {
    try {
      const newAnnouncement = await createAnnouncement({ message })
      setAnnouncements(prev => [newAnnouncement, ...prev])
      return newAnnouncement
    } catch (err: any) {
      setError(err.message || "Failed to create announcement")
      throw err
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    
    // Set up polling for new announcements every 30 seconds
    const interval = setInterval(fetchAnnouncements, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
    postAnnouncement
  }
} 