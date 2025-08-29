"use client"

import { create } from "zustand"

export type Student = {
  id: string
  name: string
  email: string
  status: "active" | "suspended" | "invited"
  enrolledCourseIds: string[]
  invitedAt?: number
}

type StudentsState = {
  students: Student[]
  addStudent: (data: Pick<Student, "name" | "email"> & { enrolledCourseIds?: string[] }) => void
  inviteStudent: (data: Pick<Student, "name" | "email"> & { enrolledCourseIds?: string[] }) => Student
  setStatus: (id: string, status: Student["status"]) => void
  removeStudent: (id: string) => void
}

const KEY = "mockStudentsDirectory"

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

function read(): Student[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Student[]
  } catch {
    return []
  }
}
function write(students: Student[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(students))
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  students: read(),
  addStudent: ({ name, email, enrolledCourseIds = [] }) => {
    const s: Student = { id: uid(), name, email, enrolledCourseIds, status: "active" }
    const next = [...get().students, s]
    write(next)
    set({ students: next })
  },
  inviteStudent: ({ name, email, enrolledCourseIds = [] }) => {
    const s: Student = { id: uid(), name, email, enrolledCourseIds, status: "invited", invitedAt: Date.now() }
    const next = [...get().students, s]
    write(next)
    set({ students: next })
    return s
  },
  setStatus: (id, status) => {
    const next = get().students.map((s) => (s.id === id ? { ...s, status } : s))
    write(next)
    set({ students: next })
  },
  removeStudent: (id) => {
    const next = get().students.filter((s) => s.id !== id)
    write(next)
    set({ students: next })
  },
}))

