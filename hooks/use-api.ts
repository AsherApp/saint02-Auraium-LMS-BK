"use client"

import { useState, useCallback } from "react"
import { http } from "@/services/http"
import { useToast } from "./use-toast"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const execute = useCallback(async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body?: any
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await http<T>(url, {
        method,
        body
      })

      setData(response)
      
      if (options.onSuccess) {
        options.onSuccess(response)
      }

      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        })
      }

      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }

      if (options.errorMessage) {
        toast({
          title: "Error",
          description: options.errorMessage,
          variant: "destructive",
        })
      }

      throw error
    } finally {
      setLoading(false)
    }
  }, [options, toast])

  const get = useCallback((url: string) => execute('GET', url), [execute])
  const post = useCallback((url: string, body?: any) => execute('POST', url, body), [execute])
  const put = useCallback((url: string, body?: any) => execute('PUT', url, body), [execute])
  const del = useCallback((url: string) => execute('DELETE', url), [execute])
  const patch = useCallback((url: string, body?: any) => execute('PATCH', url, body), [execute])

  return {
    data,
    loading,
    error,
    execute,
    get,
    post,
    put,
    delete: del,
    patch,
    reset: () => {
      setData(null)
      setError(null)
    }
  }
}
