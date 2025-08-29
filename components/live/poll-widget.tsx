"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { http } from "@/services/http"

export function PollWidget({ sessionId, isHost = false }: { sessionId: string; isHost?: boolean }) {
  const { user } = useAuthStore()
  const myEmail = user?.email || "jane@student.edu"
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [opts, setOpts] = useState("Yes, No")

  // Fetch polls
  useEffect(() => {
    const fetchPolls = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/polls`)
        setPolls(response.items || [])
      } catch (err: any) {
        console.error('Failed to fetch polls:', err)
        // Don't show error for session not found - just show empty polls
        if (err.message?.includes('session_not_found') || err.message?.includes('404')) {
          setPolls([])
        } else {
          setError(err.message || "Failed to load polls")
          setPolls([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()
    
    // Set up polling to refresh polls every 3 seconds for real-time updates
    const interval = setInterval(fetchPolls, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Clear success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const sorted = polls.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  async function create() {
    const options = opts.split(",").filter(o => o.trim())
    if (!q.trim() || options.length < 2) {
      console.error('Invalid poll data:', { question: q, options })
      return
    }
    
    setCreating(true)
    setError(null)
    
    try {
      const response = await http(`/api/live/${sessionId}/polls`, {
        method: 'POST',
        body: { question: q, options }
      })
      
      // Refresh polls immediately
      const pollsResponse = await http<any>(`/api/live/${sessionId}/polls`)
      setPolls(pollsResponse.items || [])
      
      // Clear form
      setQ("")
      setOpts("Yes, No")
      setSuccess("Poll created successfully!")
    } catch (err: any) {
      console.error('Failed to create poll:', err)
      setError(err.message || "Failed to create poll")
    } finally {
      setCreating(false)
    }
  }

  async function vote(pollId: string, optionId: string) {
    try {
      await http(`/api/live/${sessionId}/polls/${pollId}/vote`, {
        method: 'POST',
        body: { option_id: optionId }
      })
      
      // Refresh polls to get updated vote counts
      const response = await http<any>(`/api/live/${sessionId}/polls`)
      setPolls(response.items || [])
    } catch (err: any) {
      console.error('Failed to vote:', err)
      setError(err.message || "Failed to vote")
    }
  }

  async function close(pollId: string) {
    try {
      await http(`/api/live/${sessionId}/polls/${pollId}/close`, {
        method: 'POST'
      })
      
      // Refresh polls to get updated status
      const response = await http<any>(`/api/live/${sessionId}/polls`)
      console.log('Refreshed polls after close:', response.items)
      setPolls(response.items || [])
    } catch (err: any) {
      console.error('Failed to close poll:', err)
      setError(err.message || "Failed to close poll")
    }
  }

  return (
    <div data-polls-card>
      <div className="text-xs text-slate-300 mb-2 flex items-center justify-between">
        <span>Polls</span>
        <div className="flex items-center gap-2">
          {success && (
            <span className="text-green-400 text-xs">{success}</span>
          )}
          {error && (
            <span className="text-red-400 text-xs">{error}</span>
          )}
        </div>
      </div>

      {isHost ? (
        <div className="space-y-2 mb-3 p-3 bg-white/5 rounded border border-white/10">
          <div className="text-[11px] text-slate-400 font-medium">Create a quick poll for the class</div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Question (e.g., Are you ready for the quiz?)"
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
          <Input
            value={opts}
            onChange={(e) => setOpts(e.target.value)}
            placeholder="Options, comma-separated (Yes, No, Maybe)"
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
          <Button 
            onClick={create} 
            variant="secondary" 
            className="bg-blue-600/80 hover:bg-blue-600 text-white w-full"
            disabled={!q.trim() || opts.split(",").filter(o => o.trim()).length < 2 || creating}
          >
            {creating ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading polls...</div>
        ) : error ? (
          <div className="text-red-300 text-sm">Error loading polls</div>
        ) : sorted.length === 0 ? (
          <div className="text-slate-400 text-sm">No polls yet.</div>
        ) : (
          sorted.map((p) => {
            const total = p.options?.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0) || 1
            return (
              <div key={p.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="text-slate-100 text-sm">{p.question}</div>
                <div className="mt-2 space-y-2">
                  {p.options?.map((o: any) => {
                    const pct = Math.round(((o.votes?.length || 0) / total) * 100)
                    const mine = o.votes?.includes(myEmail) || false
                    return (
                      <button
                        key={o.id}
                        onClick={() => vote(p.id, o.id)}
                        disabled={p.closed || isHost}
                        className={`w-full text-left rounded-md px-2 py-1 text-sm border border-white/10 ${
                          mine ? "bg-emerald-600/20 text-emerald-100 border-emerald-500/30" : "bg-white/5 text-slate-200 hover:bg-white/10"
                        } ${p.closed ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{o.text}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-80">{o.votes?.length || 0} votes</span>
                            <span className="text-xs opacity-80">({pct}%)</span>
                          </div>
                        </div>
                        <div className="mt-1 h-1.5 rounded bg-white/10 overflow-hidden">
                          <div className="h-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                        </div>
                        {mine && (
                          <div className="text-xs text-emerald-300 mt-1">✓ Your vote</div>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(p.created_at).toLocaleString()}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    p.closed ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
                  }`}>
                    {p.closed ? "CLOSED" : "ACTIVE"}
                  </span>
                </div>
                
                {/* Vote count summary */}
                <div className="mt-2 text-xs text-slate-400">
                  Total votes: {total} • Created by: {p.created_by}
                </div>
                
                {isHost && !p.closed ? (
                  <>
                    <Separator className="my-2 bg-white/10" />
                    <Button
                      onClick={() => close(p.id)}
                      variant="secondary"
                      className="bg-red-600/80 hover:bg-red-600 text-white w-full"
                    >
                      Close Poll
                    </Button>
                  </>
                ) : null}
                
                {isHost && p.closed ? (
                  <>
                    <Separator className="my-2 bg-white/10" />
                    <div className="text-xs text-slate-400 text-center">
                      Poll closed • {total} total votes
                    </div>
                  </>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
