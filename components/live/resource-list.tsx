"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LinkIcon, Paperclip } from "lucide-react"
import { http } from "@/services/http"

export function ResourceList({
  sessionId,
  myEmail,
  canUpload = true,
}: {
  sessionId: string
  myEmail: string
  canUpload?: boolean
}) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/resources`)
        setResources(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to load resources")
        setResources([])
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [sessionId])

  async function add() {
    if (!title.trim()) return
    
    try {
      await http(`/api/live/${sessionId}/resources`, {
        method: 'POST',
        body: { title, url: url || undefined }
      })
      
      // Refresh resources
      const response = await http<any>(`/api/live/${sessionId}/resources`)
      setResources(response.items || [])
      
      setTitle("")
      setUrl("")
    } catch (err: any) {
      console.error('Failed to add resource:', err)
    }
  }

  return (
    <div>
      <div className="text-xs text-slate-300 mb-2">Resources</div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading resources...</div>
        ) : error ? (
          <div className="text-red-300 text-sm">Error loading resources</div>
        ) : resources.length === 0 ? (
          <div className="text-slate-400 text-sm">No resources yet.</div>
        ) : (
          resources
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((r) => (
              <div key={r.id} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-slate-100 text-sm flex items-center gap-2">
                  {r.url ? <LinkIcon className="h-3.5 w-3.5 text-slate-300" /> : <Paperclip className="h-3.5 w-3.5" />}
                  <span className="truncate">{r.title}</span>
                </div>
                <div className="text-[11px] text-slate-400">by {r.uploader_email}</div>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-300 hover:underline break-all"
                  >
                    {r.url}
                  </a>
                ) : null}
              </div>
            ))
        )}
      </div>

      {canUpload ? (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
          <div className="flex gap-2">
            <Input
              placeholder="https://link (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
            />
            <Button
              onClick={add}
              disabled={!title.trim()}
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              Add
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
