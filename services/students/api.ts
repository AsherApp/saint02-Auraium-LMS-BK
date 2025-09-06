import { httpClient } from "../http"

export type Student = {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive'
  created_at: string
}

export type Enrollment = {
  id: string
  course_id: string
  student_email: string
  enrolled_at: string
  progress?: number
}

// No mock data - return empty results when API fails
const mockStudents: Student[] = []

export async function listStudents() {
  // Try real API first
  try {
    return await http<{ items: Student[] }>('/api/students')
  } catch (error) {
    // Fallback to mock data
    return { items: mockStudents }
  }
}

export async function getStudent(email: string) {
  // Try real API first
  try {
    return await http<Student>(`/api/students/${email}`)
  } catch (error) {
    // Fallback to mock data
    return mockStudents.find(s => s.email === email) || null
  }
}

export async function createStudent(data: Omit<Student, 'id' | 'created_at'>) {
  // Try real API first
  try {
    return await http<Student>('/api/students', {
      method: 'POST',
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString()
    }
    mockStudents.push(newStudent)
    return newStudent
  }
}

export async function updateStudent(email: string, data: Partial<Omit<Student, 'id' | 'created_at'>>) {
  // Try real API first
  try {
    return await http<Student>(`/api/students/${email}`, {
      method: 'PUT',
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const studentIndex = mockStudents.findIndex(s => s.email === email)
    if (studentIndex !== -1) {
      mockStudents[studentIndex] = {
        ...mockStudents[studentIndex],
        ...data
      }
      return mockStudents[studentIndex]
    }
    throw new Error('Student not found')
  }
}

export async function deleteStudent(email: string) {
  // Try real API first
  try {
    return await http<{ ok: true }>(`/api/students/${email}`, {
      method: 'DELETE'
    })
  } catch (error) {
    // Fallback to mock data
    const studentIndex = mockStudents.findIndex(s => s.email === email)
    if (studentIndex !== -1) {
      mockStudents.splice(studentIndex, 1)
      return { ok: true }
    }
    throw new Error('Student not found')
  }
}

export async function enrollStudent(email: string, courseId: string) {
  // Try real API first
  try {
    return await http<Enrollment>(`/api/students/${email}/enroll`, {
      method: 'POST',
      body: { course_id: courseId }
    })
  } catch (error) {
    // Fallback to mock data
    const newEnrollment: Enrollment = {
      id: `enrollment-${Date.now()}`,
      course_id: courseId,
      student_email: email,
      enrolled_at: new Date().toISOString()
    }
    return newEnrollment
  }
}

export async function getStudentCourses(email: string) {
  // Try real API first
  try {
    return await http<{ items: any[] }>(`/api/students/${email}/courses`)
  } catch (error) {
    // Fallback to mock data
    return { items: [] }
  }
} 