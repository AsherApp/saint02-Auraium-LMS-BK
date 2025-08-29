import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { 
  getModulesByCourse, 
  getModule, 
  createModule, 
  updateModule, 
  deleteModule,
  type Module,
  type CreateModuleData,
  type UpdateModuleData
} from './api'

export function useModulesByCourse(courseId: string) {
  const { user } = useAuthStore()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    if (!courseId || !user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await getModulesByCourse(courseId)
      setModules(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }, [courseId, user?.email])

  const addModule = useCallback(async (data: CreateModuleData) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      const newModule = await createModule(data)
      setModules(prev => [...prev, newModule])
      return newModule
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create module')
    }
  }, [user?.email])

  const updateModuleById = useCallback(async (moduleId: string, data: UpdateModuleData) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      const updatedModule = await updateModule(moduleId, data)
      setModules(prev => prev.map(module => 
        module.id === moduleId ? updatedModule : module
      ))
      return updatedModule
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update module')
    }
  }, [user?.email])

  const removeModule = useCallback(async (moduleId: string) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      await deleteModule(moduleId)
      setModules(prev => prev.filter(module => module.id !== moduleId))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete module')
    }
  }, [user?.email])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
    create: addModule,
    update: updateModuleById,
    remove: removeModule
  }
}

export function useModule(moduleId: string) {
  const { user } = useAuthStore()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModule = useCallback(async () => {
    if (!moduleId || !user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const moduleData = await getModule(moduleId)
      setModule(moduleData)
    } catch (err: any) {
      setError(err.message || 'Failed to load module')
    } finally {
      setLoading(false)
    }
  }, [moduleId, user?.email])

  const updateModuleData = useCallback(async (data: UpdateModuleData) => {
    if (!user?.email || !module) throw new Error('User not authenticated or module not loaded')
    
    try {
      const updatedModule = await updateModule(moduleId, data)
      setModule(updatedModule)
      return updatedModule
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update module')
    }
  }, [user?.email, module, moduleId])

  useEffect(() => {
    fetchModule()
  }, [fetchModule])

  return {
    module,
    loading,
    error,
    refetch: fetchModule,
    update: updateModuleData
  }
} 