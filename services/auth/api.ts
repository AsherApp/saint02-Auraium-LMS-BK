import { httpClient } from "../http"

export type User = {
  id: string
  email: string
  role: 'teacher' | 'student'
  name?: string
  student_code?: string
  subscription_status?: string
  max_students_allowed?: number
  // Profile information
  first_name?: string
  last_name?: string
  full_name?: string
  user_type?: string
}

export type Student = {
  email: string
  name: string
  status: string
  created_at: string
}

export type AuthResponse = {
  user: User
  token?: string
}

// Store JWT token and user data in localStorage
function storeAuthToken(token: string, user?: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-token', token)
    if (user) {
      localStorage.setItem('auth-store', JSON.stringify(user))
    }
  }
}

// Clear auth data
function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-store')
    localStorage.removeItem('user-email')
    localStorage.removeItem('user-role')
  }
}

export async function getCurrentUser(userEmail: string, userRole?: string) {
  try {
    const user = await http<User>(`/api/auth/me`)
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    throw new Error('user_not_found')
  }
}

export async function teacherSignIn(email: string, password: string): Promise<User> {
  try {
    const response = await http<AuthResponse>(`/api/auth/teacher/signin`, {
      method: 'POST',
      body: { email, password }
    })
    
    // Store JWT token and user data if provided
    if (response.token) {
      storeAuthToken(response.token, response.user)
    }
    
    return response.user || response as User
  } catch (error) {
    console.error('Teacher sign in failed:', error)
    throw new Error('Invalid credentials')
  }
}

export async function registerTeacher(data: { name: string; email: string; password: string }): Promise<User> {
  try {
    // Split name into first_name and last_name
    const nameParts = data.name.trim().split(' ')
    const first_name = nameParts[0] || ''
    const last_name = nameParts.slice(1).join(' ') || ''
    
    const response = await http<AuthResponse>(`/api/auth/teacher/register`, {
      method: 'POST',
      body: {
        first_name,
        last_name,
        email: data.email,
        password: data.password
      }
    })
    
    // Store JWT token and user data if provided
    if (response.token) {
      storeAuthToken(response.token, response.user)
    }
    
    return response.user || {
      email: data.email,
      role: "teacher" as const,
      name: data.name
    } as User
  } catch (error) {
    console.error('Teacher registration failed:', error)
    throw new Error('Registration failed')
  }
}

export async function studentSignInWithCode(email: string, code: string): Promise<User> {
  try {
    const response = await http<AuthResponse>(`/api/auth/student/signin-code`, {
      method: 'POST',
      body: { email, code }
    })
    
    // Store JWT token and user data if provided
    if (response.token) {
      storeAuthToken(response.token, response.user)
    }
    
    return response.user || response as User
  } catch (error) {
    console.error('Student sign in with code failed:', error)
    throw new Error('Invalid student code')
  }
}

export async function studentSignIn(studentCode: string, password: string): Promise<User> {
  try {
    const response = await http<AuthResponse>(`/api/auth/student/signin`, {
      method: 'POST',
      body: { student_code: studentCode, password }
    })
    
    // Store JWT token and user data if provided
    if (response.token) {
      storeAuthToken(response.token, response.user)
    }
    
    return response.user || response as User
  } catch (error) {
    console.error('Student sign in failed:', error)
    throw new Error('Invalid student code or password')
  }
}

export async function getTeacherStudents(teacherEmail: string) {
  try {
    return await http<{ items: Student[] }>(`/api/auth/teacher/students`)
  } catch (error) {
    console.error('Failed to get teacher students:', error)
    throw new Error('Failed to fetch students')
  }
}

export async function createStudentLoginCode(email: string) {
  try {
    return await http<{ code: string; expires_at: string }>(`/api/auth/student/login-code`, {
      method: 'POST',
      body: { email }
    })
  } catch (error) {
    console.error('Failed to create login code:', error)
    throw new Error('Failed to create login code')
  }
}

// Logout function
export function logout() {
  clearAuthData()
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('auth-token')
  return !!token
}

// Get stored token
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth-token')
} 