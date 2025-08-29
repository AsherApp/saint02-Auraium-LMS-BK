export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
}

export const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

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
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  
  // Add JWT authentication if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    // Use development bypass for testing
    headers['x-dev'] = 'true'
    headers['x-user-email'] = 'mecki@test.com'
    headers['x-user-role'] = 'teacher'
  }
  
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
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

