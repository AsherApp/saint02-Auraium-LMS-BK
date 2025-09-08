export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
}

export const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://auraiumlmsbk.up.railway.app'

// Get JWT token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('auth-token')
  return token
}

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  
  // Get authentication token
  const token = getAuthToken()
  
  // Check if body is FormData
  const isFormData = opts.body instanceof FormData
  
  // Prepare headers
  const headers: Record<string, string> = {
    // Only set Content-Type for non-FormData requests
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers || {}),
  }
  
  // Add JWT authentication if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Prepare body
  let body: string | FormData | undefined
  if (opts.body) {
    if (isFormData) {
      body = opts.body as FormData
    } else {
      body = JSON.stringify(opts.body)
    }
  }
  
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body,
    cache: 'no-store',
  })
  
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    
    // Handle authentication errors
    if (res.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-store')
      }
      throw new Error('Authentication failed. Please log in again.')
    }
    
    throw new Error(text || `HTTP ${res.status}`)
  }
  
  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

// Convenience methods for common HTTP operations
export const httpClient = {
  get: <T>(path: string, headers?: Record<string, string>) => 
    http<T>(path, { method: 'GET', headers }),
  
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'POST', body, headers }),
  
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'PUT', body, headers }),
  
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'PATCH', body, headers }),
  
  delete: <T>(path: string, headers?: Record<string, string>) => 
    http<T>(path, { method: 'DELETE', headers }),
}

