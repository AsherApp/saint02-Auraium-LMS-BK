"use client"

import { useState, useEffect } from "react"
import { getMyLiveSessions, createLiveSession, updateSessionStatus, addLiveMessage, addLiveResource } from "./api"
import type { LiveSession } from "./api"

export function useLiveSessionsFn(userEmail?: string, userRole?: string) {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    if (!userEmail || !userRole) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await getMyLiveSessions(userEmail, userRole)
      setSessions(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (data: {
    course_id?: string
    module_id?: string
    title: string
    description?: string
    start_at: number
    session_type: "course" | "module" | "general"
  }) => {
    try {
      const newSession = await createLiveSession(data)
      setSessions(prev => [newSession, ...prev])
      return newSession
    } catch (err: any) {
      setError(err.message || "Failed to create session")
      throw err
    }
  }

  const updateStatus = async (id: string, status: "scheduled" | "active" | "ended") => {
    try {
      const updatedSession = await updateSessionStatus(id, status)
      setSessions(prev => prev.map(s => s.id === id ? updatedSession : s))
      return updatedSession
    } catch (err: any) {
      setError(err.message || "Failed to update session status")
      throw err
    }
  }

  const sendMessage = async (sessionId: string, text: string) => {
    try {
      await addLiveMessage(sessionId, text)
    } catch (err: any) {
      setError(err.message || "Failed to send message")
      throw err
    }
  }

  const uploadResource = async (sessionId: string, title: string, url?: string) => {
    try {
      await addLiveResource(sessionId, title, url)
    } catch (err: any) {
      setError(err.message || "Failed to upload resource")
      throw err
    }
  }

  useEffect(() => {
    fetchSessions()
    
    // Set up polling to refresh sessions every 10 seconds
    const interval = setInterval(() => {
      fetchSessions()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [userEmail, userRole])

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateStatus,
    sendMessage,
    uploadResource
  }
} 