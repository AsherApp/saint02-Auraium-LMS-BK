import { http } from "../http"

// Get all students for teacher (for adding to courses)
export async function listStudents(): Promise<{ items: any[] }> {
  return await http<{ items: any[] }>('/api/students/me')
}

// Enroll student in course
export async function enrollStudent(studentEmail: string, courseId: string): Promise<any> {
  return await http<any>(`/api/students/enroll`, {
    method: 'POST',
    body: { student_email: studentEmail, course_id: courseId }
  })
}
