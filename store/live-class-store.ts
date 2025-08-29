"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type LiveStatus = "scheduled" | "active" | "ended"

export type LiveSession = {
  id: string
  courseId: string
  title: string
  description?: string
  startAt: number
  endAt?: number
  status: LiveStatus
  hostEmail: string
  participants: string[]
}

export type ChatMessage = {
  id: string
  sessionId: string
  from: string
  text: string
  at: number
}

export type ResourceItem = {
  id: string
  sessionId: string
  title: string
  url?: string
  uploader: string
  at: number
}

export type PollOption = { id: string; text: string; votes: string[] }
export type Poll = {
  id: string
  sessionId: string
  question: string
  options: PollOption[]
  createdBy: string
  createdAt: number
  closed?: boolean
}

export type StrokePoint = { x: number; y: number }
export type Stroke = {
  id: string
  sessionId: string
  points: StrokePoint[]
  color: string
  width: number
  by: string
}

type LiveClassState = {
  hydrated: boolean
  sessions: LiveSession[]
  messages: ChatMessage[]
  resources: ResourceItem[]
  polls: Poll[]
  strokes: Record<string, Stroke[]> // sessionId -> strokes

  // queries
  getById: (id?: string) => LiveSession | undefined
  listByTeacher: (email: string) => LiveSession[]
  listByStudent: (email: string) => LiveSession[]

  // actions
  seedIfEmpty: () => void
  addSession: (input: {
    courseId: string
    title: string
    description?: string
    startAt: number
    hostEmail: string
  }) => void
  setStatus: (id: string, status: LiveStatus) => void
  join: (id: string, email: string) => void
  leave: (id: string, email: string) => void

  addMessage: (sessionId: string, from: string, text: string) => void
  addResource: (sessionId: string, title: string, url: string | undefined, uploader: string) => void

  createPoll: (sessionId: string, question: string, options: string[], createdBy: string) => void
  votePoll: (sessionId: string, pollId: string, optionId: string, voter: string) => void
  closePoll: (sessionId: string, pollId: string) => void

  addStroke: (stroke: Stroke) => void
  clearWhiteboard: (sessionId: string) => void
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const useLiveClassStore = create<LiveClassState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      sessions: [],
      messages: [],
      resources: [],
      polls: [],
      strokes: {},

      getById: (id) => get().sessions.find((s) => s.id === id),
      listByTeacher: (email) => get().sessions.filter((s) => s.hostEmail?.toLowerCase() === email.toLowerCase()),
      listByStudent: (email) => {
        // Include sessions a student is in or any scheduled/live session for demo visibility
        const lower = email.toLowerCase()
        return get().sessions.filter(
          (s) => s.participants.map((p) => p.toLowerCase()).includes(lower) || s.status !== "ended",
        )
      },

      seedIfEmpty: () => {
        const { hydrated, sessions } = get()
        if (hydrated) return
        // mark hydrated first to prevent repeated sets in Strict Mode mounts
        set({ hydrated: true })
        if (sessions.length > 0) return

        const now = Date.now()
        const demoHost = "alex@school.edu"
        const courseA = "course_algebra_1"
        const courseB = "course_geometry_1"
        const s1: LiveSession = {
          id: uid("live"),
          courseId: courseA,
          title: "Algebra I • Linear Equations",
          description: "Solving and graphing linear equations",
          startAt: now + 30 * 60 * 1000,
          status: "scheduled",
          hostEmail: demoHost,
          participants: ["jane@student.edu"],
        }
        const s2: LiveSession = {
          id: uid("live"),
          courseId: courseA,
          title: "Algebra I • Practice Hour",
          description: "Live Q&A and practice problems",
          startAt: now - 15 * 60 * 1000,
          status: "active",
          hostEmail: demoHost,
          participants: ["jane@student.edu", "sam@student.edu"],
        }
        const s3: LiveSession = {
          id: uid("live"),
          courseId: courseB,
          title: "Geometry • Angles Recap",
          description: "Review of interior/exterior angles",
          startAt: now - 2 * 24 * 60 * 60 * 1000,
          endAt: now - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          status: "ended",
          hostEmail: demoHost,
          participants: ["jane@student.edu"],
        }
        set((st) => ({ sessions: [s1, s2, s3], messages: st.messages, resources: st.resources, polls: st.polls }))
      },

      addSession: ({ courseId, title, description, startAt, hostEmail }) =>
        set((st) => ({
          sessions: [
            ...st.sessions,
            {
              id: uid("live"),
              courseId,
              title,
              description,
              startAt,
              status: "scheduled",
              hostEmail,
              participants: [],
            },
          ],
        })),

      setStatus: (id, status) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status,
                  endAt: status === "ended" ? Date.now() : s.endAt,
                }
              : s,
          ),
        })),

      join: (id, email) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === id && !s.participants.includes(email) ? { ...s, participants: [...s.participants, email] } : s,
          ),
        })),

      leave: (id, email) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === id ? { ...s, participants: s.participants.filter((p) => p !== email) } : s,
          ),
        })),

      addMessage: (sessionId, from, text) =>
        set((st) => ({
          messages: [
            ...st.messages,
            {
              id: uid("m"),
              sessionId,
              from,
              text: text.trim(),
              at: Date.now(),
            },
          ],
        })),

      addResource: (sessionId, title, url, uploader) =>
        set((st) => ({
          resources: [
            ...st.resources,
            { id: uid("r"), sessionId, title: title.trim(), url: url?.trim(), uploader, at: Date.now() },
          ],
        })),

      createPoll: (sessionId, question, options, createdBy) =>
        set((st) => ({
          polls: [
            ...st.polls,
            {
              id: uid("poll"),
              sessionId,
              question: question.trim(),
              options: options
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => ({ id: uid("opt"), text: t, votes: [] })),
              createdBy,
              createdAt: Date.now(),
            },
          ],
        })),

      votePoll: (sessionId, pollId, optionId, voter) =>
        set((st) => ({
          polls: st.polls.map((p) => {
            if (p.sessionId !== sessionId || p.id !== pollId || p.closed) return p
            // Remove previous vote
            const current = p.options.map((o) => ({ ...o, votes: o.votes.filter((v) => v !== voter) }))
            // Add vote to selected option
            const next = current.map((o) => (o.id === optionId ? { ...o, votes: [...o.votes, voter] } : o))
            return { ...p, options: next }
          }),
        })),

      closePoll: (sessionId, pollId) =>
        set((st) => ({
          polls: st.polls.map((p) => (p.sessionId === sessionId && p.id === pollId ? { ...p, closed: true } : p)),
        })),

      addStroke: (stroke) =>
        set((st) => {
          const list = st.strokes[stroke.sessionId] ?? []
          return { strokes: { ...st.strokes, [stroke.sessionId]: [...list, stroke] } }
        }),

      clearWhiteboard: (sessionId) =>
        set((st) => {
          const next = { ...st.strokes }
          next[sessionId] = []
          return { strokes: next }
        }),
    }),
    {
      name: "live-class-store-v1",
      partialize: (st) => ({
        hydrated: st.hydrated,
        sessions: st.sessions,
        messages: st.messages,
        resources: st.resources,
        polls: st.polls,
        strokes: st.strokes,
      }),
    },
  ),
)
