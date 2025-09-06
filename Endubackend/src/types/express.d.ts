import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'student' | 'teacher'
        student_code?: string
        subscription_status?: string
        max_students_allowed?: number
        supportId?: string
        supportRole?: string
      }
    }
  }
}
