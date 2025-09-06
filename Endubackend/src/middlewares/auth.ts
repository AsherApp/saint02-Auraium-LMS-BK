import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import { verifyToken, decodeToken } from '../lib/jwt.js'
import { supabaseAdmin } from '../lib/supabase.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // console.log('Auth middleware - NODE_ENV:', process.env.NODE_ENV)
    
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    
    // Allow dev bypass in development environment
    if (!token && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
      const devBypass = req.headers['x-dev'] === 'true' && typeof req.headers['x-user-email'] === 'string'
      if (devBypass) {
        // Set user info for dev mode
        const userEmail = req.headers['x-user-email'] as string
        const userRole = req.headers['x-user-role'] as string
        if (userEmail) {
          // Check if this is a student endpoint and set appropriate role
          const isStudentEndpoint = req.path.includes('/student') || req.path.includes('/students')
          const role = (userRole === 'teacher' || userRole === 'student') ? userRole : (isStudentEndpoint ? 'student' : 'teacher')
          req.user = { id: 'dev-user-id', email: userEmail, role: role as 'teacher' | 'student' }
          // console.log('Dev bypass auth:', { email: userEmail, role })
          return next()
        }
      }
      // console.log('Dev bypass failed:', { 
      //   hasToken: !!token, 
      //   hasDevHeader: req.headers['x-dev'] === 'true',
      //   hasUserEmail: typeof req.headers['x-user-email'] === 'string',
      //   userEmail: req.headers['x-user-email']
      // })
      return res.status(401).json({ error: 'missing_token' })
    }
    
    if (!token) {
      return res.status(401).json({ error: 'missing_token' })
    }
    
    // Validate JWT token
    try {
      const payload = await verifyToken(token)
      
      if (!payload.email) {
        return res.status(401).json({ error: 'invalid_token_payload' })
      }
      
      // Get full user profile from database using the unified view
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', payload.email)
        .single()

      req.user = { 
        id: payload.id,
        email: payload.email, 
        role: payload.role || 'teacher',
        student_code: payload.student_code,
        subscription_status: payload.subscription_status,
        max_students_allowed: payload.max_students_allowed,
        // Add profile information
        first_name: userProfile?.first_name,
        last_name: userProfile?.last_name,
        full_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : undefined,
        user_type: userProfile?.user_type
      }
      return next()
    } catch (jwtError) {
      console.error('JWT validation failed:', jwtError)
      return res.status(401).json({ error: 'invalid_token' })
    }
  } catch (e) {
    console.error('Auth middleware error:', e)
    return res.status(401).json({ error: 'authentication_failed' })
  }
}

// Middleware to check if user is a teacher
export function requireTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'teacher_access_required' })
  }
  next()
}

// Middleware to check if user is a student
export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'student_access_required' })
  }
  next()
}

// Middleware to check subscription status
export function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'teacher_access_required' })
  }
  
  // Check subscription status (implement with your billing logic)
  // For now, allow all teachers
  next()
}

