"use client"

import { create } from "zustand"
import type { Course } from "./course-store"

type ProgressState = {
  // map[courseId][lessonId] = true if completed
  map: Record<string, Record<string, boolean>>
  isCompleted: (courseId: string, lessonId: string) => boolean
  setComplete: (courseId: string, lessonId: string, complete: boolean) => void
  getNextPrev: (
    course: Course,
    moduleId: string,
    lessonId: string,
  ) => { next?: { moduleId: string; lessonId: string }; prev?: { moduleId: string; lessonId: string } }
}

const KEY = "mockProgress"

function read(): ProgressState["map"] {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as ProgressState["map"]
  } catch {
    return {}
  }
}
function write(map: ProgressState["map"]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(map))
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  map: read(),
  isCompleted: (courseId, lessonId) => {
    const m = get().map
    return !!m[courseId]?.[lessonId]
  },
  setComplete: (courseId, lessonId, complete) => {
    const current = structuredClone(get().map)
    current[courseId] = current[courseId] || {}
    if (complete) current[courseId][lessonId] = true
    else delete current[courseId][lessonId]
    write(current)
    set({ map: current })
  },
  getNextPrev: (course, moduleId, lessonId) => {
    const flat: { moduleId: string; lessonId: string }[] = []
    for (const m of course.modules) {
      for (const l of m.lessons) {
        flat.push({ moduleId: m.id, lessonId: l.id })
      }
    }
    const idx = flat.findIndex((f) => f.moduleId === moduleId && f.lessonId === lessonId)
    const prev = idx > 0 ? flat[idx - 1] : undefined
    const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined
    return { prev, next }
  },
}))
