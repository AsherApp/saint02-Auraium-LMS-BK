import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string
        role: 'student' | 'teacher'
        supportId?: string
        supportRole?: string
      }
    }
  }
}
