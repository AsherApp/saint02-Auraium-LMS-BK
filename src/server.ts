import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import fs from 'fs'
import rateLimit from 'express-rate-limit'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { router } from './routes/index.js'
import { 
  securityMiddleware, 
  preventParameterPollution, 
  logSecurityEvent,
  preventBruteForce 
} from './middlewares/security.js'
import { ChatService } from './services/chat.service'
import { AttendanceService } from './services/attendance.service'
import { ParticipantService } from './services/participant.service'
import { setSocketServer } from './lib/socket.io'

const app = express()

// Health check endpoint - MUST be first to avoid middleware interference
app.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 4000,
      version: '1.0.0',
      memory: process.memoryUsage(),
      pid: process.pid
    }
    
    res.status(200).json(healthData)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Simple readiness check
app.get('/ready', (req, res) => {
  try {
    res.status(200).json({ 
      ready: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Simple root endpoint for debugging
app.get('/', (req, res) => {
  res.json({ 
    message: 'Auraium LMS Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
      connectSrc: ["'self'", "https://zoom.us", "ws://localhost:4000", "ws://127.0.0.1:4000"],
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
  'https://auraiumlms-fe.vercel.app', // Additional Vercel URL
  'https://auraiumlms-frontend.vercel.app', // Additional Vercel URL
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001', 
]

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Log all origins for debugging
    console.log('CORS request from origin:', origin)
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin')
      return callback(null, true)
    }
    
    // Check if origin is in allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Allowing request from allowed origin:', origin)
      return callback(null, true)
    } 
    
    // Allow Vercel domains (always)
    if (origin && origin.endsWith('.vercel.app')) {
      console.log('CORS: Allowing Vercel domain:', origin)
      return callback(null, true)
    }
    
    // Allow localhost in development
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      console.log('CORS: Allowing localhost:', origin)
      return callback(null, true)
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS: Development mode - allowing origin:', origin)
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
  console.log(`404 - Endpoint not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: '/api/students/enroll (POST)'
  })
})

const port = Number(process.env.PORT || 4000)
const host = '0.0.0.0'

// Create HTTP server
const httpServer = http.createServer(app)

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins, // Use the same allowedOrigins as Express CORS
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

setSocketServer(io)

// Store active connections and their associated liveClassId and userId
interface SocketData {
  liveClassId?: string
  userId?: string
  userEmail?: string
  userRole?: 'teacher' | 'student'
}

interface JoinRoomPayload {
  liveClassId: string
  userId: string
  userEmail: string
}

interface SendMessagePayload extends JoinRoomPayload {
  content: string
}

interface WhiteboardPayload {
  liveClassId: string
  action: WhiteboardAction
}

interface LiveClassOnlyPayload {
  liveClassId: string
}

interface WhiteboardPoint {
  x: number
  y: number
}

interface WhiteboardAction {
  type: 'draw'
  path: WhiteboardPoint[]
}

const WHITEBOARD_MAX_ACTIONS = 500
const whiteboardState = new Map<string, WhiteboardAction[]>()

io.on('connection', (socket: Socket) => {
  console.log(`⚡ User connected: ${socket.id}`)

  socket.on('join_room', async ({ liveClassId, userId, userEmail }: JoinRoomPayload) => {
    socket.join(liveClassId)
    console.log(`User ${userId} (${userEmail}) joined room: ${liveClassId}`)

    // Store user and room info on the socket for disconnect handling
    const socketData = socket.data as SocketData
    socketData.liveClassId = liveClassId
    socketData.userId = userId
    socketData.userEmail = userEmail

    // Record student join time - only for students, not teachers
    if (userId && liveClassId) {
      try {
        // Check if user is the teacher of this live class
        const { supabaseAdmin } = await import('./lib/supabase.js')
        const { data: liveClass } = await supabaseAdmin
          .from('live_classes')
          .select('teacher_id')
          .eq('id', liveClassId)
          .single()

        const isTeacher = liveClass?.teacher_id === userId
        socketData.userRole = isTeacher ? 'teacher' : 'student'

        // Only record attendance for students
        if (!isTeacher) {
          await AttendanceService.recordJoin({ liveClassId, studentId: userId })
        }

        await ParticipantService.recordJoin({
          liveClassId,
          userId,
          email: userEmail,
          role: isTeacher ? 'teacher' : 'student'
        })
      } catch (error) {
        console.error('Error recording student join time:', error)
      }
    }

    // Emit historical messages to the newly joined user
    try {
      const messages = await ChatService.getMessages(liveClassId)
      socket.emit('message_history', messages)
    } catch (error) {
      console.error(`Error fetching message history for room ${liveClassId}:`, error)
    }

    // Broadcast updated participant list
    try {
      const participants = await ParticipantService.getParticipants(liveClassId)
      io.to(liveClassId).emit('participant_update', participants)
    } catch (error) {
      console.error('Error broadcasting participant update on join:', error)
    }
  })

  socket.on('send_message', async ({ liveClassId, userId, userEmail, content }: SendMessagePayload) => {
    if (!liveClassId || !userId || !userEmail || !content) {
      console.warn('Invalid message payload received:', { liveClassId, userId, userEmail, content })
      return
    }

    try {
      const newMessage = await ChatService.saveMessage({
        liveClassId,
        senderId: userId,
        senderEmail: userEmail,
        content,
      })
      // Broadcast the message to everyone in the room
      io.to(liveClassId).emit('receive_message', newMessage)
    } catch (error) {
      console.error(`Error saving or broadcasting message in room ${liveClassId}:`, error)
      // Optionally, emit an error back to the sender
      socket.emit('message_error', 'Failed to send message.')
    }
  })

  socket.on('disconnect', async () => {
    console.log(`🔌 User disconnected: ${socket.id}`)
    // Record student leave time - only for students, not teachers
    const socketData = socket.data as SocketData
    if (socketData.userId && socketData.liveClassId) {
      try {
        // Check if user is the teacher of this live class
        const { supabaseAdmin } = await import('./lib/supabase.js')
        const { data: liveClass } = await supabaseAdmin
          .from('live_classes')
          .select('teacher_id')
          .eq('id', socketData.liveClassId)
          .single()

        const isTeacher = liveClass?.teacher_id === socketData.userId

        // Only record leave time for students
        if (!isTeacher) {
          await AttendanceService.recordLeave({ liveClassId: socketData.liveClassId, studentId: socketData.userId })
        }

        if (socketData.userRole) {
          try {
            await ParticipantService.recordLeave({
              liveClassId: socketData.liveClassId,
              userId: socketData.userId,
              role: socketData.userRole
            })
          } catch (participantError) {
            console.error('Error recording participant leave:', participantError)
          }
        }
      } catch (error) {
        console.error('Error recording student leave time:', error)
      }

      // Broadcast updated participant list after disconnect
      try {
        const participants = await ParticipantService.getParticipants(socketData.liveClassId)
        io.to(socketData.liveClassId).emit('participant_update', participants)
      } catch (error) {
        console.error('Error broadcasting participant update on disconnect:', error)
      }
    }
  })

  // --- Whiteboard Event Handlers ---
  socket.on('request_whiteboard_state', ({ liveClassId }: LiveClassOnlyPayload) => {
    const history = whiteboardState.get(liveClassId) ?? []
    socket.emit('sync_whiteboard_state', history)
  })

  socket.on('draw_action', ({ liveClassId, action }: WhiteboardPayload) => {
    const existingHistory = whiteboardState.get(liveClassId) ?? []
    const updatedHistory = [...existingHistory, action]
    if (updatedHistory.length > WHITEBOARD_MAX_ACTIONS) {
      updatedHistory.splice(0, updatedHistory.length - WHITEBOARD_MAX_ACTIONS)
    }
    whiteboardState.set(liveClassId, updatedHistory)
    socket.to(liveClassId).emit('receive_draw_action', action)
  })

  socket.on('clear_whiteboard', ({ liveClassId }: LiveClassOnlyPayload) => {
    whiteboardState.set(liveClassId, [])
    socket.to(liveClassId).emit('receive_clear_whiteboard')
  })

  socket.on('undo_draw', ({ liveClassId }: LiveClassOnlyPayload) => {
    const existingHistory = whiteboardState.get(liveClassId) ?? []
    if (existingHistory.length) {
      whiteboardState.set(liveClassId, existingHistory.slice(0, -1))
    }
    socket.to(liveClassId).emit('receive_undo_draw')
  })

  socket.on('live_class_ended', ({ liveClassId }: LiveClassOnlyPayload) => {
    whiteboardState.delete(liveClassId)
  })
})


// Add startup logging
console.log('🚀 Starting server...')
console.log(`📡 Port: ${port}`)
console.log(`🌐 Host: ${host}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Production mode' : 'Development mode'}`)
console.log(`📦 Node Version: ${process.version}`)
console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

// Log all environment variables (excluding sensitive ones)
console.log('🔧 Environment variables loaded:')
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
console.log(`   - PORT: ${process.env.PORT || 'not set (using 4000)'}`)
console.log(`   - DATABASE: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`)

// Start server
const server = httpServer.listen(port, host, () => { // Use httpServer here
  console.log(`✅ Server successfully started!`)
  console.log(`🌐 Listening on: http://${host}:${port}`)
  console.log(`🏥 Health check: http://${host}:${port}/health`)
  console.log(`🚀 API ready: http://${host}:${port}/api`)
  console.log(`🚀 WebSocket ready: ws://${host}:${port}`) // New log
  console.log(`⏰ Server started at: ${new Date().toISOString()}`)
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
  // Don't exit in production, just log the error
})
