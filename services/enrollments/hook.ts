"use client"
import { useEffect, useState } from 'react'
import { enroll, getRoster } from './api'

export function useEnrollmentsFn(courseId?: string) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getRoster>>['items']>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    getRoster(courseId).then((r) => setItems(r.items)).finally(() => setLoading(false))
  }, [courseId])
  return {
    items, loading,
    refresh: async () => {
      if (!courseId) return
      const r = await getRoster(courseId)
      setItems(r.items)
    },
    enroll: async (student_email: string) => {
      if (!courseId) return
      await enroll(courseId, student_email)
      await (async () => {
        const r = await getRoster(courseId)
        setItems(r.items)
      })()
    }
  }
}

export function useMultiRosterFn(courseIds: string[]) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getRoster>>['items']>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const lists = await Promise.all(courseIds.map((id) => getRoster(id)))
        if (cancelled) return
        const merged = lists.flatMap((r) => r.items)
        setItems(merged)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (courseIds.length) load()
    return () => { cancelled = true }
  }, [courseIds.join(',')])
  return {
    items, loading,
    refresh: async () => {
      const lists = await Promise.all(courseIds.map((id) => getRoster(id)))
      setItems(lists.flatMap((r) => r.items))
    }
  }
}


