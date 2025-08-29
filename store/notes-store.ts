"use client"

import { create } from "zustand"

type NotesMap = Record<string, Record<string, string>> // map[courseId][lessonId] = note

type NotesState = {
  map: NotesMap
  getNote: (courseId: string, lessonId: string) => string
  setNote: (courseId: string, lessonId: string, note: string) => void
}

const KEY = "mockNotes"

function read(): NotesMap {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as NotesMap
  } catch {
    return {}
  }
}
function write(map: NotesMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(map))
}

export const useNotesStore = create<NotesState>((set, get) => ({
  map: read(),
  getNote: (courseId, lessonId) => get().map[courseId]?.[lessonId] || "",
  setNote: (courseId, lessonId, note) => {
    const next = structuredClone(get().map)
    next[courseId] = next[courseId] || {}
    next[courseId][lessonId] = note
    write(next)
    set({ map: next })
  },
}))
