import { http } from "../http"

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

export async function listStudents() {
  return await http<{ items: Student[] }>('/api/students')
}

export async function getStudent(email: string) {
  return await http<Student>(`/api/students/${email}`)
}

export async function createStudent(data: Omit<Student, 'id' | 'created_at'>) {
  return await http<Student>('/api/students', {
    method: 'POST',
    body: data
  })
}

export async function updateStudent(email: string, data: Partial<Omit<Student, 'id' | 'created_at'>>) {
  return await http<Student>(`/api/students/${email}`, {
    method: 'PUT',
    body: data
  })
}

export async function deleteStudent(email: string) {
  return await http<{ ok: true }>(`/api/students/${email}`, {
    method: 'DELETE'
  })
}

export async function enrollStudent(email: string, courseId: string) {
  return await http<Enrollment>(`/api/students/${email}/enroll`, {
    method: 'POST',
    body: { course_id: courseId }
  })
}

export async function getStudentCourses(email: string) {
  return await http<{ items: any[] }>(`/api/students/${email}/courses`)
} 