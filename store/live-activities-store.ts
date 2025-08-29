"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type LiveNote = {
  sessionId: string
  authorEmail: string
  content: string
  updatedAt: number
}

export type LiveQuiz = {
  id: string
  sessionId: string
  title: string
  options: string[]
  open: boolean
  createdAt: number
}

export type LiveQuizResponse = {
  id: string
  quizId: string
  studentEmail: string
  answerIndex: number
  submittedAt: number
}

export type LiveClasswork = {
  id: string
  sessionId: string
  title: string
  description?: string
  open: boolean
  createdAt: number
}

export type LiveClassworkSubmission = {
  id: string
  classworkId: string
  studentEmail: string
  payload: string
  grade?: number
  feedback?: string
  submittedAt: number
}

type ActivitiesState = {
  notes: LiveNote[]
  quizzes: LiveQuiz[]
  quizResponses: LiveQuizResponse[]
  classworks: LiveClasswork[]
  classworkSubs: LiveClassworkSubmission[]

  setNote: (sessionId: string, authorEmail: string, content: string) => void
  getNote: (sessionId: string, authorEmail: string) => LiveNote | undefined

  startQuiz: (sessionId: string, title: string, options: string[]) => LiveQuiz
  closeQuiz: (quizId: string) => void
  submitQuiz: (quizId: string, studentEmail: string, answerIndex: number) => void
  getActiveQuiz: (sessionId: string) => LiveQuiz | undefined

  assignClasswork: (sessionId: string, title: string, description?: string) => LiveClasswork
  closeClasswork: (classworkId: string) => void
  submitClasswork: (classworkId: string, studentEmail: string, payload: string) => void
  gradeClasswork: (classworkId: string, studentEmail: string, grade?: number, feedback?: string) => void
  getOpenClasswork: (sessionId: string) => LiveClasswork | undefined
}

function uid(p = "id") {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`
}

export const useLiveActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      notes: [],
      quizzes: [],
      quizResponses: [],
      classworks: [],
      classworkSubs: [],

      setNote: (sessionId, authorEmail, content) =>
        set((st) => {
          const existing = st.notes.find((n) => n.sessionId === sessionId && n.authorEmail === authorEmail)
          if (existing) {
            return { notes: st.notes.map((n) => (n === existing ? { ...n, content, updatedAt: Date.now() } : n)) }
          }
          return { notes: [...st.notes, { sessionId, authorEmail, content, updatedAt: Date.now() }] }
        }),

      getNote: (sessionId, authorEmail) => get().notes.find((n) => n.sessionId === sessionId && n.authorEmail === authorEmail),

      startQuiz: (sessionId, title, options) => {
        const quiz: LiveQuiz = { id: uid("quiz"), sessionId, title, options, open: true, createdAt: Date.now() }
        set((st) => ({ quizzes: [...st.quizzes, quiz] }))
        return quiz
      },
      closeQuiz: (quizId) => set((st) => ({ quizzes: st.quizzes.map((q) => (q.id === quizId ? { ...q, open: false } : q)) })),
      submitQuiz: (quizId, studentEmail, answerIndex) =>
        set((st) => {
          const existing = st.quizResponses.find((r) => r.quizId === quizId && r.studentEmail === studentEmail)
          const response: LiveQuizResponse = { id: existing?.id || uid("qr"), quizId, studentEmail, answerIndex, submittedAt: Date.now() }
          const next = existing ? st.quizResponses.map((r) => (r.id === existing.id ? response : r)) : [...st.quizResponses, response]
          return { quizResponses: next }
        }),
      getActiveQuiz: (sessionId) => get().quizzes.find((q) => q.sessionId === sessionId && q.open),

      assignClasswork: (sessionId, title, description) => {
        const cw: LiveClasswork = { id: uid("cw"), sessionId, title, description, open: true, createdAt: Date.now() }
        set((st) => ({ classworks: [...st.classworks, cw] }))
        return cw
      },
      closeClasswork: (classworkId) =>
        set((st) => ({ classworks: st.classworks.map((c) => (c.id === classworkId ? { ...c, open: false } : c)) })),
      submitClasswork: (classworkId, studentEmail, payload) =>
        set((st) => ({
          classworkSubs: [
            ...st.classworkSubs.filter((s) => !(s.classworkId === classworkId && s.studentEmail === studentEmail)),
            { id: uid("cws"), classworkId, studentEmail, payload, submittedAt: Date.now() },
          ],
        })),
      gradeClasswork: (classworkId, studentEmail, grade, feedback) =>
        set((st) => ({
          classworkSubs: st.classworkSubs.map((s) =>
            s.classworkId === classworkId && s.studentEmail === studentEmail ? { ...s, grade, feedback } : s,
          ),
        })),
      getOpenClasswork: (sessionId) => get().classworks.find((c) => c.sessionId === sessionId && c.open),
    }),
    { name: "live-activities-store-v1" },
  ),
)

