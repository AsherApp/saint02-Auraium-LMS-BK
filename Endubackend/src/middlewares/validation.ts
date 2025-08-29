import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email().toLowerCase().trim()
export const passwordSchema = z.string().min(8).max(128)
export const studentCodeSchema = z.string().regex(/^[A-Z0-9]{8,12}$/)
export const uuidSchema = z.string().uuid()

// Teacher registration schema
export const teacherRegistrationSchema = z.object({
  first_name: z.string().min(1).max(50).trim(),
  last_name: z.string().min(1).max(50).trim(),
  email: emailSchema,
  password: passwordSchema
})

// Student registration schema
export const studentRegistrationSchema = z.object({
  invite_code: z.string().min(6).max(20),
  first_name: z.string().min(1).max(50).trim(),
  last_name: z.string().min(1).max(50).trim(),
  email: emailSchema,
  password: passwordSchema
})

// Course creation schema
export const courseSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

// Assignment creation schema
export const assignmentSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  type: z.enum(['essay', 'quiz', 'project', 'discussion']),
  due_at: z.string().datetime().optional(),
  form: z.record(z.any()).optional(),
  resources: z.array(z.string().url()).optional()
})

// Live session schema
export const liveSessionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  start_at: z.string().datetime(),
  duration_minutes: z.number().min(15).max(480).default(60)
})

// Poll creation schema
export const pollSchema = z.object({
  question: z.string().min(1).max(500).trim(),
  options: z.array(z.string().min(1).max(200).trim()).min(2).max(10)
})

// Message schema
export const messageSchema = z.object({
  to_email: emailSchema,
  subject: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(5000).trim()
})

// Validation middleware factory
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body)
      req.body = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      return res.status(400).json({ error: 'invalid_request_data' })
    }
  }
}

// Validate query parameters
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query)
      req.query = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      return res.status(400).json({ error: 'invalid_query_parameters' })
    }
  }
}

// Validate URL parameters
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params)
      req.params = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      return res.status(400).json({ error: 'invalid_url_parameters' })
    }
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Sanitize object inputs
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  return obj
}

// Sanitize middleware
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  req.body = sanitizeObject(req.body)
  next()
}

export function sanitizeQuery(req: Request, res: Response, next: NextFunction) {
  req.query = sanitizeObject(req.query)
  next()
}

export function sanitizeParams(req: Request, res: Response, next: NextFunction) {
  req.params = sanitizeObject(req.params)
  next()
}
