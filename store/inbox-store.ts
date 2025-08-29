"use client"

import { create } from "zustand"

export type Message = {
  id: string
  toEmail: string
  fromEmail: string
  subject: string
  body: string
  at: number
  read?: boolean
}

type InboxState = {
  messages: Message[]
  send: (m: Omit<Message, "id" | "at" | "read">) => void
  listFor: (email: string) => Message[]
  markRead: (id: string, read?: boolean) => void
  remove: (id: string) => void
  listThreadsFor: (email: string) => { id: string; subject: string; with: string; unread: number; lastAt: number }[]
}

const KEY = "mockInbox"

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}
function read(): Message[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Message[]
  } catch {
    return []
  }
}
function write(v: Message[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(v))
}

export const useInboxStore = create<InboxState>((set, get) => ({
  messages: read(),
  send: (m) => {
    const msg: Message = { id: uid(), at: Date.now(), read: false, ...m }
    const next = [...get().messages, msg]
    write(next)
    set({ messages: next })
  },
  listFor: (email) => get().messages.filter((m) => m.toEmail.toLowerCase() === email.toLowerCase()).sort((a,b)=>b.at-a.at),
  markRead: (id, read = true) => {
    const next = get().messages.map((m) => (m.id === id ? { ...m, read } : m))
    write(next)
    set({ messages: next })
  },
  remove: (id) => {
    const next = get().messages.filter((m) => m.id !== id)
    write(next)
    set({ messages: next })
  },
  listThreadsFor: (email) => {
    const me = email.toLowerCase()
    const map = new Map<string, { id: string; subject: string; with: string; unread: number; lastAt: number }>()
    for (const m of get().messages) {
      const involved = [m.fromEmail.toLowerCase(), m.toEmail.toLowerCase()]
      if (!involved.includes(me)) continue
      const other = m.fromEmail.toLowerCase() === me ? m.toEmail : m.fromEmail
      const key = `${m.subject}|${[me, other.toLowerCase()].sort().join(':')}`
      const t = map.get(key) || { id: key, subject: m.subject, with: other, unread: 0, lastAt: 0 }
      if (!m.read && m.toEmail.toLowerCase() === me) t.unread += 1
      t.lastAt = Math.max(t.lastAt, m.at)
      map.set(key, t)
    }
    return Array.from(map.values()).sort((a,b)=>b.lastAt-a.lastAt)
  },
}))

