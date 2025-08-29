"use client"

import { useRef, useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/shared/glass-card"
import { SendHorizonal } from "lucide-react"
import { http } from "@/services/http"

export function ChatWidget({
  sessionId,
  className = "",
  readOnly = false,
}: {
  sessionId: string
  className?: string
  readOnly?: boolean
}) {
  const { user } = useAuthStore()
  const myEmail = user?.email || "jane@student.edu"

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/messages`)
        setMessages(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to load messages")
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  async function send() {
    const t = text.trim()
    if (!t) return
    
    try {
      await http(`/api/live/${sessionId}/messages`, {
        method: 'POST',
        body: { text: t }
      })
      
      // Refresh messages
      const response = await http<any>(`/api/live/${sessionId}/messages`)
      setMessages(response.items || [])
      
      setText("")
      queueMicrotask(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
      })
    } catch (err: any) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <div className={className}>
      <GlassCard className="p-3 h-full">
        <div className="text-xs text-slate-300 mb-2">Class Chat</div>
        <div ref={listRef} className="h-64 lg:h-[420px] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading messages...</div>
          ) : error ? (
            <div className="text-red-300 text-sm">Error loading messages</div>
          ) : sorted.length === 0 ? (
            <div className="text-slate-400 text-sm">No messages yet.</div>
          ) : (
            sorted.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.from_email === myEmail ? "ml-auto bg-white/20 text-white" : "bg-white/10 text-slate-200"
                }`}
              >
                <div className="text-[10px] opacity-70">{m.from_email}</div>
                <div>{m.text}</div>
                <div className="text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
        {!readOnly && (
          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="bg-white/5 border-white/10 text-white placeholder-slate-400"
              placeholder="Type a message..."
            />
            <Button onClick={send} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white">
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
