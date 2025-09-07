"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, teacherSignIn, studentSignInWithCode, studentSignIn, getTeacherStudents, registerTeacher } from "./api"
import { useAuthStore } from "@/store/auth-store"
import type { User, Student } from "./api"

export function useAuthFn() {
  const { user, setUser, refreshUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInTeacher = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const userData = await teacherSignIn(email, password)
      setUser(userData)
      return userData
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const registerTeacherFn = async (data: { first_name: string; last_name: string; email: string; password: string }) => {
    setLoading(true)
    setError(null)
    try {
      const userData = await registerTeacher(data)
      // Auto-login the user after successful registration
      setUser(userData)
      return userData
    } catch (err: any) {
      setError(err.message || "Failed to register")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInStudentWithCode = async (email: string, code: string) => {
    setLoading(true)
    setError(null)
    try {
      const userData = await studentSignInWithCode(email, code)
      setUser(userData)
      return userData
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInStudent = async (studentCode: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const userData = await studentSignIn(studentCode, password)
      setUser(userData)
      return userData
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setError(null)
  }

  return {
    user,
    loading,
    error,
    signInTeacher,
    registerTeacher: registerTeacherFn,
    signInStudentWithCode,
    signInStudent,
    signOut,
    refreshUser
  }
}

export function useTeacherStudentsFn(teacherEmail?: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    if (!teacherEmail) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await getTeacherStudents(teacherEmail)
      setStudents(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch students")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [teacherEmail])

  return {
    students,
    loading,
    error,
    refetch: fetchStudents
  }
} 