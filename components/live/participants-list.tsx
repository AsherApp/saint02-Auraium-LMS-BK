"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { http } from "@/services/http"

export function ParticipantsList({ sessionId, session }: { sessionId: string; session?: any }) {
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
  }, [sessionId])

  if (loading) {
    return (
      <div>
        <div className="text-xs text-slate-300 mb-2">Participants</div>
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="text-xs text-slate-300 mb-2">Participants</div>
        <div className="text-red-300 text-sm">Error loading participants</div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-xs text-slate-300 mb-2">Participants ({participants.length})</div>
      <ul className="space-y-2">
        {participants.length === 0 ? (
          <li className="text-slate-400 text-sm">No participants yet</li>
        ) : (
          participants.map((participant) => (
            <li key={participant.id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{participant.email?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-slate-200 text-sm">{participant.email}</span>
              {participant.email === session?.teacher_email ? (
                <span className="ml-2 rounded bg-emerald-500/20 text-emerald-100 px-2 py-0.5 text-[11px]">Host</span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
