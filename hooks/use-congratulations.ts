"use client"

import { useState, useCallback } from 'react'

interface CongratulationsMessage {
  id: string
  title: string
  message: string
  type: 'module' | 'course' | 'exam'
  score?: number
  timestamp: number
}

export function useCongratulations() {
  const [messages, setMessages] = useState<CongratulationsMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState<CongratulationsMessage | null>(null)

  const showCongratulations = useCallback((
    title: string,
    message: string,
    type: 'module' | 'course' | 'exam' = 'module',
    score?: number
  ) => {
    const newMessage: CongratulationsMessage = {
      id: `congrats-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      score,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, newMessage])
    
    // If no current message is showing, show this one
    if (!currentMessage) {
      setCurrentMessage(newMessage)
    }
  }, [currentMessage])

  const closeCurrentMessage = useCallback(() => {
    setCurrentMessage(null)
    
    // Show next message if available
    setTimeout(() => {
      setMessages(prev => {
        const remaining = prev.slice(1)
        if (remaining.length > 0) {
          setCurrentMessage(remaining[0])
          return remaining
        }
        return []
      })
    }, 100)
  }, [])

  const clearAllMessages = useCallback(() => {
    setMessages([])
    setCurrentMessage(null)
  }, [])

  return {
    currentMessage,
    hasMessages: messages.length > 0,
    showCongratulations,
    closeCurrentMessage,
    clearAllMessages
  }
}
