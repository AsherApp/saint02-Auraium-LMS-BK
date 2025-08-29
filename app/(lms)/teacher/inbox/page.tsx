"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useInboxFn } from "@/services/inbox/hook"
import { useAuthStore } from "@/store/auth-store"

export default function TeacherInboxPage() {
  const { user } = useAuthStore()
  const myEmail = user?.email || "alex@school.edu"
  const inbox = useInboxFn(myEmail)
  const threads = inbox.threads

  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  return (
          <div className="space-y-4 w-full">
      <h1 className="text-white text-2xl font-semibold">Inbox</h1>
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-3 border-b border-white/10 text-slate-300 text-sm">Threads</div>
          <div className="max-h-[420px] overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-3 text-slate-400 text-sm">No threads.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {threads.map((t) => (
                  <li key={t.withEmail} className="p-3 hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="text-white text-sm">Conversation</div>
                      {/* Unread badge can be computed if needed */}
                    </div>
                    <div className="text-xs text-slate-400">with {t.withEmail}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>
        <div className="space-y-4">
          <GlassCard className="p-4 space-y-3">
            <div className="text-slate-300 text-sm">Compose (demo)</div>
            <Input placeholder="To (email)" value={to} onChange={(e) => setTo(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            <textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} className="w-full min-h-24 rounded-md border bg-white/5 border-white/10 text-white p-2" />
            <Button
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
              onClick={() => {
                if (!to.includes("@") || !subject.trim() || !body.trim()) return
                void inbox.send({ to_email: to.trim(), subject: subject.trim(), body: body.trim() })
                setTo(""); setSubject(""); setBody("")
              }}
            >
              Send
            </Button>
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="py-2 px-3">From</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inbox.messages.length === 0 ? (
                  <tr><td className="py-3 px-3 text-slate-400" colSpan={4}>No messages.</td></tr>
                ) : (
                  inbox.messages.map((m) => (
                    <tr key={m.id} className="border-t border-white/10">
                      <td className="py-2 px-3 text-white">{m.from_email}</td>
                      <td className="py-2 px-3 text-slate-200">{m.subject}</td>
                      <td className="py-2 px-3 text-slate-400">{new Date(m.at).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => inbox.markRead([m.id], !m.read)}>
                            {m.read ? "Unread" : "Read"}
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-red-500/20 text-red-100 hover:bg-red-500/30" onClick={() => inbox.remove([m.id])}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </GlassCard>
        </div>
      </div>
      
    </div>
  )
}

