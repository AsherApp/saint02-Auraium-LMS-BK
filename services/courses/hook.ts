"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"
import * as api from "./api"
import type { Course, Module } from "./api"

export function useCoursesFn() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.listCourses()
      setCourses(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch courses")
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = useCallback(async (data: Parameters<typeof api.createCourse>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const newCourse = await api.createCourse(data)
      setCourses(prev => [newCourse, ...prev])
      return newCourse
    } catch (err: any) {
      setError(err.message || "Failed to create course")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCourse = useCallback(async (id: string, data: Parameters<typeof api.updateCourse>[1]) => {
    setLoading(true)
    setError(null)
    try {
      const updatedCourse = await api.updateCourse(id, data)
      setCourses(prev => prev.map(c => c.id === id ? updatedCourse : c))
      return updatedCourse
    } catch (err: any) {
      setError(err.message || "Failed to update course")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCourse = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.deleteCourse(id)
      setCourses(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      setError(err.message || "Failed to delete course")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getCourse = useCallback((id: string) => {
    return courses.find(c => c.id === id)
  }, [courses])

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourse
  }
}

export function useCourseDetailFn(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourse = useCallback(async () => {
    if (!courseId) return
    
    setLoading(true)
    setError(null)
    try {
      const [courseData, modulesData] = await Promise.all([
        api.getCourse(courseId),
        api.listModules(courseId)
      ])
      setCourse(courseData)
      setModules(modulesData.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch course")
      setCourse(null)
      setModules([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const createModule = useCallback(async (data: Parameters<typeof api.createModule>[1]) => {
    setLoading(true)
    setError(null)
    try {
      const newModule = await api.createModule(courseId, data)
      setModules(prev => [...prev, newModule])
      return newModule
    } catch (err: any) {
      setError(err.message || "Failed to create module")
      throw err
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const updateModule = useCallback(async (moduleId: string, data: Parameters<typeof api.updateModule>[1]) => {
    setLoading(true)
    setError(null)
    try {
      const updatedModule = await api.updateModule(moduleId, data)
      setModules(prev => prev.map(m => m.id === moduleId ? updatedModule : m))
      return updatedModule
    } catch (err: any) {
      setError(err.message || "Failed to update module")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteModule = useCallback(async (moduleId: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.deleteModule(moduleId)
      setModules(prev => prev.filter(m => m.id !== moduleId))
    } catch (err: any) {
      setError(err.message || "Failed to delete module")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCourse = useCallback(async (data: Parameters<typeof api.updateCourse>[1]) => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const updatedCourse = await api.updateCourse(courseId, data)
      setCourse(updatedCourse)
      return updatedCourse
    } catch (err: any) {
      setError(err.message || "Failed to update course")
      throw err
    } finally {
      setLoading(false)
    }
  }, [courseId])

  return {
    course,
    modules,
    loading,
    error,
    refetch: fetchCourse,
    createModule,
    updateModule,
    deleteModule,
    updateCourse
  }
}

 