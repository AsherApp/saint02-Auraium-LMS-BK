import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import fs from 'fs'
import rateLimit from 'express-rate-limit'
import { router } from './routes/index.js'
import { 
  securityMiddleware, 
  preventParameterPollution, 
  logSecurityEvent,
  preventBruteForce 
} from './middlewares/security.js'

const app = express()

// Health check endpoint - MUST be first to avoid middleware interference
app.get('/health', (req, res) => {
  console.log('Health check requested from:', req.ip, req.headers['user-agent'])
  
  // Simple health check response
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
    version: '1.0.0'
  }
  
  console.log('Health check response:', healthData)
  res.status(200).json(healthData)
})

// Simple readiness check
app.get('/ready', (req, res) => {
  console.log('Readiness check requested')
  res.status(200).json({ 
    ready: true,
    timestamp: new Date().toISOString()
  })
})

// Simple root endpoint for debugging
app.get('/', (req, res) => {
  console.log('Root endpoint requested from:', req.ip)
  res.json({ 
    message: 'Auraium LMS Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_LIVEKIT_URL || ""],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

//app.use(limiter)

// Log request origins for debugging CORS (disabled to reduce noise)
// app.use((req, res, next) => {
//   console.log('Origin:', req.headers.origin)
//   next()
// })

// CORS configuration - More robust setup
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://yourdomain.com',
  'https://auraiumlms-ten.vercel.app', // Vercel deployment
  'https://auraiumlms.vercel.app', // Alternative Vercel URL
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001', 
]

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true)
    }
    
    // Check if origin is in allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true)
    } 
    
    // Allow Vercel domains (always)
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    
    // Allow localhost in development
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true)
    }
    
    console.warn(`CORS blocked request from origin: ${origin}`)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'x-user-role',
    'x-user-email',
    'x-dev'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // handle preflight requests properly

// JSON body parsing - limit for file uploads (50MB to match Supabase limit)
app.use(express.json({ limit: '50mb' }))

// Apply security middleware
app.use(securityMiddleware)
app.use(preventParameterPollution)
app.use(logSecurityEvent)
app.use(preventBruteForce)

// Error handling for malformed JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('Malformed JSON received:', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  next(err)
})

// Health check endpoint
app.get('/health', (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}))

// Serve uploaded files with security headers
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename
  
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' })
  }
  
  const filePath = path.join(process.cwd(), 'uploads', filename)
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.sendFile(filePath)
  } else {
    res.status(404).json({ error: 'File not found' })
  }
})

// API routes
app.use('/api', router)

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' })
  } else {
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message,
      stack: err.stack
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

const port = Number(process.env.PORT || 4000)

// Add startup logging
console.log('🚀 Starting server...')
console.log(`📡 Port: ${port}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Production mode' : 'Development mode'}`)

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server successfully started on port ${port}`)
  console.log(`🏥 Health check available at: http://0.0.0.0:${port}/health`)
})

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error)
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
