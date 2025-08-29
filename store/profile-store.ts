"use client"

import { create } from "zustand"

export type Profile = {
  userId: string
  name: string
  avatarUrl?: string
  bio?: string
}

type ProfileState = {
  profiles: Record<string, Profile>
  get: (userId: string) => Profile | undefined
  upsert: (p: Profile) => void
}

const KEY = "mockProfiles"

function read(): Record<string, Profile> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, Profile>
  } catch {
    return {}
  }
}
function write(p: Record<string, Profile>) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(p))
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: read(),
  get: (userId) => get().profiles[userId],
  upsert: (p) => {
    const next = { ...get().profiles, [p.userId]: p }
    write(next)
    set({ profiles: next })
  },
}))

