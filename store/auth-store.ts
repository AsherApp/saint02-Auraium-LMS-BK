"use client"

import { create } from "zustand"
import { getCurrentUser, getStoredToken, logout as logoutApi } from "@/services/auth/api"

export type UserRole = "teacher" | "student"
type AuthUser = { 
  id?: string
  email: string | null
  role: UserRole
  name?: string
  student_code?: string
  subscription_status?: string
  max_students_allowed?: number
} | null

type AuthState = {
  user: AuthUser
  setUser: (u: AuthUser) => void
  logout: () => void
  init: () => Promise<void>
  refreshUser: () => Promise<void>
}

function readUserFromStorage(): AuthUser {
  if (typeof window === "undefined") return null
  
  // Check for JWT token first
  const token = getStoredToken()
  if (!token) return null
  
  // Try to get user from auth-store
  const raw = localStorage.getItem("auth-store")
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (u) => {
    if (typeof window !== "undefined") {
      if (u) {
        localStorage.setItem("auth-store", JSON.stringify(u))
      } else {
        localStorage.removeItem("auth-store")
      }
    }
    set({ user: u })
  },
  logout: () => {
    logoutApi() // Clear JWT token and other auth data
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-store")
    }
    set({ user: null })
  },
  init: async () => {
    const existing = readUserFromStorage()
    if (existing) {
      set({ user: existing })
      // Try to refresh user data from backend
      try {
        await get().refreshUser()
      } catch (error) {
        console.warn("Failed to refresh user from backend:", error)
        
        // Only logout for specific auth errors, not network issues
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase()
          
          if (errorMessage.includes('user_not_found') || 
              errorMessage.includes('unauthorized') ||
              errorMessage.includes('invalid token') ||
              errorMessage.includes('authentication failed')) {
            console.log("Auth error detected during init, logging out user")
            get().logout()
          } else {
            console.log("Network error during init, keeping user logged in:", errorMessage)
          }
        }
      }
    }
  },
  refreshUser: async () => {
    const currentUser = get().user
    if (!currentUser?.email) return
    
    try {
      const userData = await getCurrentUser(currentUser.email, currentUser.role)
      const updatedUser = { ...currentUser, ...userData }
      if (typeof window !== "undefined") {
        localStorage.setItem("auth-store", JSON.stringify(updatedUser))
      }
      set({ user: updatedUser })
    } catch (error) {
      console.error("Failed to refresh user:", error)
      
      // Only logout for specific auth errors, not network/CORS issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        // Logout only for actual auth failures, not network issues
        if (errorMessage.includes('user_not_found') || 
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('invalid token') ||
            errorMessage.includes('authentication failed')) {
          console.log("Auth error detected, logging out user")
          get().logout()
        } else {
          // For network/CORS errors, keep the user logged in
          console.log("Network error detected, keeping user logged in:", errorMessage)
        }
      }
    }
  },
}))

void useAuthStore.getState().init()
