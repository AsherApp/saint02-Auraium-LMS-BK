import { Request, Response, NextFunction } from 'express'

// Security middleware to prevent common attacks
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Prevent clickjacking
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
  
  next()
}

// Validate file uploads
export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next()
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'invalid_file_type' })
  }
  
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: 'file_too_large' })
  }
  
  next()
}

// Prevent parameter pollution
export function preventParameterPollution(req: Request, res: Response, next: NextFunction) {
  // Ensure query parameters are strings, not arrays
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      req.query[key] = value[0] as string
    }
  }
  
  next()
}

// Log security events
export function logSecurityEvent(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send
  
  res.send = function(data) {
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security Event:', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        userEmail: (req as any).user?.email || 'anonymous'
      })
    }
    
    return originalSend.call(this, data)
  }
  
  next()
}

// Validate API key for external integrations
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  
  if (!apiKey) {
    return next() // Allow requests without API key for now
  }
  
  // Validate API key (implement your validation logic)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'invalid_api_key' })
  }
  
  next()
}

// Prevent brute force attacks
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function preventBruteForce(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  
  const attempts = failedAttempts.get(ip)
  
  if (attempts && now - attempts.lastAttempt < windowMs) {
    if (attempts.count >= 5) {
      return res.status(429).json({ error: 'too_many_failed_attempts' })
    }
  } else {
    failedAttempts.set(ip, { count: 0, lastAttempt: now })
  }
  
  next()
}

// Track failed login attempts
export function trackFailedLogin(ip: string) {
  const attempts = failedAttempts.get(ip)
  if (attempts) {
    attempts.count++
    attempts.lastAttempt = Date.now()
  } else {
    failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() })
  }
}

// Clean up old failed attempts
setInterval(() => {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  
  for (const [ip, attempts] of failedAttempts.entries()) {
    if (now - attempts.lastAttempt > windowMs) {
      failedAttempts.delete(ip)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
