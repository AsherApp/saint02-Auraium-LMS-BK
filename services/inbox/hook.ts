"use client"
import { useEffect, useMemo, useState } from 'react'
import { deleteMessages, listInbox, sendMessage, setRead, type Message } from './api'

export function useInboxFn(myEmail: string | null) {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!myEmail) return
    setLoading(true)
    listInbox(myEmail)
      .then((r) => setMessages(r.items))
      .finally(() => setLoading(false))
  }, [myEmail])

  const threads = useMemo(() => {
    const groups = new Map<string, Message[]>()
    for (const m of messages) {
      const other = m.from_email.toLowerCase() === myEmail?.toLowerCase() ? m.to_email : m.from_email
      const key = other.toLowerCase()
      const arr = groups.get(key) || []
      arr.push(m)
      groups.set(key, arr)
    }
    return [...groups.entries()].map(([withEmail, msgs]) => ({ withEmail, messages: msgs.sort((a,b)=>a.at.localeCompare(b.at)) }))
  }, [messages, myEmail])

  return {
    loading,
    messages,
    threads,
    refresh: async () => {
      if (!myEmail) return
      const r = await listInbox(myEmail)
      setMessages(r.items)
    },
    send: async (input: { to_email: string; subject: string; body: string }) => {
      if (!myEmail) return
      await sendMessage({ ...input, from_email: myEmail })
      await (async () => {
        const r = await listInbox(myEmail)
        setMessages(r.items)
      })()
    },
    markRead: async (ids: string[], read: boolean) => {
      await setRead(ids, read)
      await (async () => {
        if (!myEmail) return
        const r = await listInbox(myEmail)
        setMessages(r.items)
      })()
    },
    remove: async (ids: string[]) => {
      await deleteMessages(ids)
      await (async () => {
        if (!myEmail) return
        const r = await listInbox(myEmail)
        setMessages(r.items)
      })()
    },
  }
}

