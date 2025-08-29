"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"
import * as api from "./api"
import type { Message } from "./api"

export function useMessagesFn() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.getMessages()
      setMessages(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch messages")
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.email) return
    
    try {
      const response = await api.getUnreadCount()
      setUnreadCount(response.count)
    } catch (err: any) {
      console.error("Failed to fetch unread count:", err)
      setUnreadCount(0)
    }
  }, [user?.email])

  const sendMessage = useCallback(async (data: {
    to_email: string
    subject: string
    content: string
    priority?: 'normal' | 'high' | 'urgent'
  }) => {
    setLoading(true)
    setError(null)
    try {
      const newMessage = await api.sendMessage(data)
      setMessages(prev => [newMessage, ...prev])
      return newMessage
    } catch (err: any) {
      setError(err.message || "Failed to send message")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const updatedMessage = await api.markMessageAsRead(messageId)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      return updatedMessage
    } catch (err: any) {
      setError(err.message || "Failed to mark message as read")
      throw err
    }
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await api.deleteMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      // Update unread count if message was unread
      const deletedMessage = messages.find(msg => msg.id === messageId)
      if (deletedMessage && !deletedMessage.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete message")
      throw err
    }
  }, [messages])

  const getConversation = useCallback(async (otherEmail: string) => {
    try {
      const response = await api.getConversation(otherEmail)
      return response.items
    } catch (err: any) {
      setError(err.message || "Failed to fetch conversation")
      throw err
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchUnreadCount()
  }, [fetchMessages, fetchUnreadCount])

  return {
    messages,
    unreadCount,
    loading,
    error,
    refetch: fetchMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    getConversation
  }
} 