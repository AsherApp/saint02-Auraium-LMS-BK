"use client"

import { create } from "zustand"

export type LessonType = "video" | "quiz" | "file" | "discussion" | "poll"

export type LessonContent = {
  video?: { url: string; description?: string }
  file?: { url: string; name?: string; description?: string }
  quiz?: {
    questions: { id: string; question: string; options: string[]; correctIndex?: number }[]
  }
  discussion?: { prompt: string }
  poll?: { question: string; options: string[] }
}

export type Lesson = {
  id: string
  title: string
  type: LessonType
  content?: LessonContent
}

export type Module = {
  id: string
  title: string
  lessons: Lesson[]
}

export type Course = {
  id: string
  title: string
  description?: string
  ownerEmail: string
  modules: Module[]
  enrolled: string[] // student emails
  createdAt: number
  status: "draft" | "published" | "archived"
  visibility: "private" | "unlisted" | "public"
  enrollmentPolicy: "invite_only" | "request" | "open"
  publishedAt?: number
}

type CourseState = {
  courses: Course[]
  list: () => Course[]
  addCourse: (data: { title: string; description?: string; ownerEmail: string }) => Course
  updateCourse: (
    courseId: string,
    patch: Partial<Pick<Course, "title" | "description" | "status" | "visibility" | "enrollmentPolicy" | "publishedAt">>,
  ) => void
  enrollStudent: (courseId: string, email: string) => void
  addModule: (courseId: string, title: string) => Module
  removeModule: (courseId: string, moduleId: string) => void
  addLesson: (courseId: string, moduleId: string, data: { title: string; type: LessonType }) => Lesson
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    patch: Partial<Pick<Lesson, "title" | "type">>,
  ) => void
  setLessonContent: (courseId: string, moduleId: string, lessonId: string, content: LessonContent) => void
  removeLesson: (courseId: string, moduleId: string, lessonId: string) => void
  getById: (id: string) => Course | undefined
  seedIfEmpty: () => void
}

const KEY = "mockCourses"

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

function readCourses(): Course[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Partial<Course>[]
    // backfill defaults for newly added fields
    return raw.map((c) => ({
      id: c.id!,
      title: c.title || "Untitled Course",
      description: c.description,
      ownerEmail: c.ownerEmail || "",
      modules: c.modules || [],
      enrolled: c.enrolled || [],
      createdAt: c.createdAt || Date.now(),
      status: c.status || "draft",
      visibility: c.visibility || "private",
      enrollmentPolicy: c.enrollmentPolicy || "invite_only",
      publishedAt: c.publishedAt,
    }))
  } catch {
    return []
  }
}

function writeCourses(courses: Course[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(courses))
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  list: () => get().courses,
  addCourse: ({ title, description, ownerEmail }) => {
    const course: Course = {
      id: uid(),
      title,
      description,
      ownerEmail,
      modules: [],
      enrolled: [],
      createdAt: Date.now(),
      status: "draft",
      visibility: "private",
      enrollmentPolicy: "invite_only",
    }
    const next = [...get().courses, course]
    writeCourses(next)
    set({ courses: next })
    return course
  },
  updateCourse: (courseId, patch) => {
    const next = get().courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c))
    writeCourses(next)
    set({ courses: next })
  },
  enrollStudent: (courseId, email) => {
    const next = get().courses.map((c) =>
      c.id === courseId && !c.enrolled.includes(email) ? { ...c, enrolled: [...c.enrolled, email] } : c,
    )
    writeCourses(next)
    set({ courses: next })
  },
  addModule: (courseId, title) => {
    const mod: Module = { id: uid(), title, lessons: [] }
    const next = get().courses.map((c) => (c.id === courseId ? { ...c, modules: [...c.modules, mod] } : c))
    writeCourses(next)
    set({ courses: next })
    return mod
  },
  removeModule: (courseId, moduleId) => {
    const next = get().courses.map((c) =>
      c.id === courseId ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) } : c,
    )
    writeCourses(next)
    set({ courses: next })
  },
  addLesson: (courseId, moduleId, data) => {
    const lesson: Lesson = { id: uid(), ...data, content: {} }
    const next = get().courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m)),
          }
        : c,
    )
    writeCourses(next)
    set({ courses: next })
    return lesson
  },
  updateLesson: (courseId, moduleId, lessonId, patch) => {
    const next = get().courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((m) =>
              m.id === moduleId
                ? {
                    ...m,
                    lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
                  }
                : m,
            ),
          }
        : c,
    )
    writeCourses(next)
    set({ courses: next })
  },
  setLessonContent: (courseId, moduleId, lessonId, content) => {
    const next = get().courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((m) =>
              m.id === moduleId
                ? {
                    ...m,
                    lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, content } : l)),
                  }
                : m,
            ),
          }
        : c,
    )
    writeCourses(next)
    set({ courses: next })
  },
  removeLesson: (courseId, moduleId, lessonId) => {
    const next = get().courses.map((c) =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((m) =>
              m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
            ),
          }
        : c,
    )
    writeCourses(next)
    set({ courses: next })
  },
  getById: (id) => get().courses.find((c) => c.id === id),
  seedIfEmpty: () => {
    const existing = readCourses()
    if (existing.length > 0) {
      set({ courses: existing })
      return
    }
    // Demo content showing alignment with Study Area
    const m1Id = uid()
    const l1Id = uid()
    const l2Id = uid()
    const demo: Course[] = [
      {
        id: uid(),
        title: "Algebra I",
        description: "Fundamentals of algebra with problem sets and quizzes.",
        ownerEmail: "alex@school.edu",
        modules: [
          {
            id: m1Id,
            title: "Expressions & Equations",
            lessons: [
              {
                id: l1Id,
                title: "Variables and Expressions",
                type: "video",
                content: { video: { url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" } },
              },
              {
                id: l2Id,
                title: "Solving Linear Equations",
                type: "quiz",
                content: {
                  quiz: {
                    questions: [
                      {
                        id: uid(),
                        question: "Solve: 2x + 4 = 10",
                        options: ["x = 2", "x = 3", "x = 4"],
                        correctIndex: 1,
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        enrolled: ["jane@student.edu"],
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        status: "published",
        visibility: "public",
        enrollmentPolicy: "invite_only",
        publishedAt: Date.now() - 1000 * 60 * 60 * 24,
      },
    ]
    writeCourses(demo)
    set({ courses: demo })
  },
}))

// Initialize from storage on import
useCourseStore.getState().seedIfEmpty()
