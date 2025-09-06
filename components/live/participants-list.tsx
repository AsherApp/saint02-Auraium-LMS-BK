"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { http } from "@/services/http"
import { motion, AnimatePresence } from "framer-motion"
import { Users, User, Crown, Clock } from "lucide-react"

export function ParticipantsList({ sessionId, session, isHost = false }: { sessionId: string; session?: any; isHost?: boolean }) {
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/participants`)
        // Deduplicate participants by email
        const uniqueParticipants = (response.items || []).reduce((acc: any[], participant: any) => {
          const existing = acc.find(p => p.email === participant.email)
          if (!existing) {
            acc.push(participant)
          }
          return acc
        }, [])
        setParticipants(uniqueParticipants)
      } catch (err: any) {
        setError(err.message || "Failed to load participants")
        setParticipants([])
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
    
    // Poll for new participants every 15 seconds (reduced frequency)
    const interval = setInterval(fetchParticipants, 15000)
    return () => clearInterval(interval)
  }, [sessionId])

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
          <Users className="h-4 w-4" />
          <span>Participants</span>
          {isHost && (
            <Badge variant="secondary" className="ml-auto">
              {participants.length}
            </Badge>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <span className="text-sm">Loading participants...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
          <Users className="h-4 w-4" />
          <span>Participants</span>
          {isHost && (
            <Badge variant="secondary" className="ml-auto">
              {participants.length}
            </Badge>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-400">
            <div className="text-sm mb-2">Error loading participants</div>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {participants.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-400 py-8"
            >
              <User className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <div className="text-sm">No participants yet</div>
              <div className="text-xs text-slate-500">Participants will appear here when they join</div>
            </motion.div>
          ) : (
            <motion.ul className="space-y-2">
              {participants.map((participant, index) => (
                <motion.li 
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                      {participant.name?.slice(0, 2).toUpperCase() || participant.email?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 text-sm font-medium truncate">
                        {participant.name || participant.email?.split('@')[0] || 'Unknown User'}
                      </span>
                      {participant.email === session?.teacher_email ? (
                        <Badge variant="default" className="bg-emerald-500/20 text-emerald-100 text-xs px-2 py-0.5">
                          <Crown className="h-3 w-3 mr-1" />
                          Host
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        Joined {new Date(participant.joined_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
