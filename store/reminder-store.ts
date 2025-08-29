"use client"

import { create } from "zustand"

type SnoozeMap = Record<string, number> // assignmentId -> snoozedUntil timestamp

type ReminderState = {
  snoozed: SnoozeMap
  isSnoozed: (assignmentId: string) => boolean
  snooze: (assignmentId: string, hours: number) => void
  clearExpired: () => void
}

const KEY = "mockSnoozed"

function read(): SnoozeMap {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as SnoozeMap
  } catch {
    return {}
  }
}
function write(map: SnoozeMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(map))
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  snoozed: read(),
  isSnoozed: (id) => {
    const until = get().snoozed[id]
    return until ? until > Date.now() : false
  },
  snooze: (id, hours) => {
    const until = Date.now() + hours * 60 * 60 * 1000
    const next = { ...get().snoozed, [id]: until }
    write(next)
    set({ snoozed: next })
  },
  clearExpired: () => {
    const ent = Object.entries(get().snoozed).filter(([_, ts]) => ts > Date.now())
    const next = Object.fromEntries(ent)
    write(next)
    set({ snoozed: next })
  },
}))
