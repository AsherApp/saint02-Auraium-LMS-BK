declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'student' | 'teacher'
        name?: string
        student_code?: string
        subscription_status?: string
        max_students_allowed?: number
        supportId?: string
        supportRole?: string
        first_name?: string
        last_name?: string
        full_name?: string
        user_type?: string
      }
    }
  }
}

export {}
