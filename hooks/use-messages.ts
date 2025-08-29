import { useState, useEffect } from "react"
import { http } from "@/services/http"

export interface Message {
  id: string
  from: string
  to: string
  subject: string
  content: string
  priority: "low" | "normal" | "high"
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface NewMessage {
  to: string
  subject: string
  content: string
  priority: "low" | "normal" | "high"
}

export function useMessagesFn(userEmail?: string, userRole?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch messages
  useEffect(() => {
    if (!userEmail) return

    const fetchMessages = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<Message[]>(`/api/messages`)
        setMessages(response || [])
      } catch (err: any) {
        console.error('Failed to fetch messages:', err)
        setError(err.message || 'Failed to load messages')
        // For now, use mock data if API fails
        setMessages([
          {
            id: '1',
            from: 'teacher@school.edu',
            to: userEmail,
            subject: 'Welcome to the Course',
            content: 'Welcome to our course! I hope you enjoy learning with us.',
            priority: 'normal',
            is_read: false,
            is_starred: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            from: 'system@lms.com',
            to: userEmail,
            subject: 'Course Assignment Due',
            content: 'Reminder: Your assignment is due tomorrow.',
            priority: 'high',
            is_read: true,
            is_starred: true,
            is_archived: false,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [userEmail, userRole])

  const sendMessage = async (messageData: NewMessage): Promise<void> => {
    if (!userEmail) throw new Error('User email required')

    try {
      const response = await http<Message>('/api/messages', {
        method: 'POST',
        body: {
          from: userEmail,
          ...messageData
        }
      })
      
      // Add the new message to the list
      setMessages(prev => [response, ...prev])
    } catch (err: any) {
      console.error('Failed to send message:', err)
      throw new Error(err.message || 'Failed to send message')
    }
  }

  const toggleStar = async (messageId: string): Promise<void> => {
    try {
      await http(`/api/messages/${messageId}/star`, { method: 'PATCH' })
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_starred: !msg.is_starred } : msg
      ))
    } catch (err: any) {
      console.error('Failed to toggle star:', err)
      // Update locally even if API fails
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_starred: !msg.is_starred } : msg
      ))
    }
  }

  const toggleArchive = async (messageId: string): Promise<void> => {
    try {
      await http(`/api/messages/${messageId}/archive`, { method: 'PATCH' })
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_archived: !msg.is_archived } : msg
      ))
    } catch (err: any) {
      console.error('Failed to toggle archive:', err)
      // Update locally even if API fails
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_archived: !msg.is_archived } : msg
      ))
    }
  }

  const markAsRead = async (messageId: string): Promise<void> => {
    try {
      await http(`/api/messages/${messageId}/read`, { method: 'PATCH' })
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    } catch (err: any) {
      console.error('Failed to mark as read:', err)
      // Update locally even if API fails
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    }
  }

  const bulkAction = async (messageIds: string[], action: 'star' | 'archive' | 'delete'): Promise<void> => {
    try {
      await http('/api/messages/bulk', {
        method: 'PATCH',
        body: { messageIds, action }
      })
      
      setMessages(prev => {
        switch (action) {
          case 'star':
            return prev.map(msg => 
              messageIds.includes(msg.id) ? { ...msg, is_starred: !msg.is_starred } : msg
            )
          case 'archive':
            return prev.map(msg => 
              messageIds.includes(msg.id) ? { ...msg, is_archived: !msg.is_archived } : msg
            )
          case 'delete':
            return prev.filter(msg => !messageIds.includes(msg.id))
          default:
            return prev
        }
      })
    } catch (err: any) {
      console.error('Failed to perform bulk action:', err)
      throw new Error(err.message || 'Failed to perform bulk action')
    }
  }

  const searchMessages = async (query: string): Promise<void> => {
    if (!query.trim()) {
      // Reset to original messages if search is empty
      return
    }

    try {
      const response = await http<Message[]>(`/api/messages/search?q=${encodeURIComponent(query)}&user=${userEmail}`)
      setMessages(response || [])
    } catch (err: any) {
      console.error('Failed to search messages:', err)
      // Fall back to client-side search
      const filtered = messages.filter(msg => 
        msg.subject?.toLowerCase().includes(query.toLowerCase()) ||
        msg.content?.toLowerCase().includes(query.toLowerCase()) ||
        msg.from?.toLowerCase().includes(query.toLowerCase())
      )
      setMessages(filtered)
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    toggleStar,
    toggleArchive,
    markAsRead,
    bulkAction,
    searchMessages
  }
}
