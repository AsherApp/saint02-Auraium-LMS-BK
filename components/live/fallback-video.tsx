"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { http } from "@/services/http"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

interface Participant {
  id: string
  email: string
  joined_at: string
}

export function FallbackVideo({ sessionId, myEmail, session }: { sessionId: string; myEmail: string; session?: any }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!sessionId) return
      
      setLoading(true)
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
        console.error('Failed to load participants:', err)
        setParticipants([])
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
    
    // Poll for updates
    const interval = setInterval(fetchParticipants, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  const getRoleColor = (email: string) => {
    // Check if this is the teacher by comparing with session teacher
    return email === 'teacher@school.edu' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-300 text-sm">Loading participants...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {participants.length === 0 ? (
          <div className="col-span-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-24 h-24 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-white/20 text-white text-xl">
                    {getInitials(myEmail)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-slate-300 text-sm">You are the only participant</div>
              <div className="text-slate-400 text-xs">Others will appear here when they join</div>
            </div>
          </div>
        ) : (
          participants.map((participant) => (
            <div key={participant.id} className="relative">
              <div className="aspect-video rounded-lg bg-white/10 flex items-center justify-center relative overflow-hidden">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-white/20 text-white text-2xl">
                    {getInitials(participant.email)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicators */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {participant.email === session?.teacher_email && (
                    <Badge variant="secondary" className={`${getRoleColor(participant.email)} text-xs`}>
                      Host
                    </Badge>
                  )}
                </div>
                
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  {micOn ? (
                    <Mic className="h-4 w-4 text-green-400" />
                  ) : (
                    <MicOff className="h-4 w-4 text-red-400" />
                  )}
                  {videoOn ? (
                    <Video className="h-4 w-4 text-green-400" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-red-400" />
                  )}
                </div>
                
                <div className="absolute bottom-2 right-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              
              <div className="mt-2 text-center">
                <div className="text-slate-200 text-sm font-medium truncate">
                  {participant.email}
                </div>
                <div className="text-slate-400 text-xs">
                  {participant.email === session?.teacher_email ? 'Host' : 'Student'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`p-3 rounded-full ${micOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`p-3 rounded-full ${videoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
          >
            {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
