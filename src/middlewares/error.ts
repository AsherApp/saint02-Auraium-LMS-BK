import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Global error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for server-side debugging
  console.error('-------------------- ERROR START --------------------')
  console.error(`Timestamp: ${new Date().toISOString()}`)
  console.error(`Request: ${req.method} ${req.originalUrl}`)
  if ((req as any).user?.id) {
    console.error(`User ID: ${(req as any).user.id}`)
  }
  if ((req as any).user?.email) {
    console.error(`User Email: ${(req as any).user.email}`)
  }
  console.error('Error Message:', err.message)
  console.error('Error Name:', err.name)
  console.error('Error Stack:', err.stack)
  if (err.errors) { // For Zod errors, etc.
    console.error('Validation Errors:', err.errors)
  }
  console.error('--------------------- ERROR END ---------------------')


  // Default error
  let error = { ...err }
  error.message = err.message

  // Custom HTTP errors (e.g., from createHttpError)
  if (err.statusCode) {
    error.statusCode = err.statusCode
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // Zod validation error (if it somehow bypasses validateBody and reaches here)
  if (err instanceof z.ZodError) {
    const message = err.errors.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  })
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}
