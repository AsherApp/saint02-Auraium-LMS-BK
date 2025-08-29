"use client"

import { create } from "zustand"

export type Announcement = {
  teacherEmail: string
  message: string
  updatedAt: number
}

type AnnouncementState = {
  byTeacher: Record<string, Announcement>
  post: (teacherEmail: string, message: string) => void
  getForTeachers: (emails: string[]) => Announcement[]
}

const KEY = "mockAnnouncements"

function read(): Record<string, Announcement> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Announcement>
  } catch {
    return {}
  }
}

function write(v: Record<string, Announcement>) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(v))
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  byTeacher: read(),
  post: (teacherEmail, message) => {
    const next = {
      ...get().byTeacher,
      [teacherEmail.toLowerCase()]: { teacherEmail, message, updatedAt: Date.now() },
    }
    write(next)
    set({ byTeacher: next })
  },
  getForTeachers: (emails) =>
    emails
      .map((e) => get().byTeacher[e.toLowerCase()])
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt) as Announcement[],
}))

