"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "system" | "light" | "dark"

type PreferencesState = {
  theme: Theme
  emailNotifications: boolean
  chatNotifications: boolean
  setTheme: (t: Theme) => void
  setEmailNotifications: (v: boolean) => void
  setChatNotifications: (v: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      emailNotifications: true,
      chatNotifications: true,
      setTheme: (t) => set({ theme: t }),
      setEmailNotifications: (v) => set({ emailNotifications: v }),
      setChatNotifications: (v) => set({ chatNotifications: v }),
    }),
    { name: "preferences-store-v1" },
  ),
)

