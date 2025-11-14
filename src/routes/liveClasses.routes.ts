import { Router } from 'express'
import { z } from 'zod'
import createHttpError from 'http-errors'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import {
  validateBody,
  validateParams,
  validateQuery
} from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  LiveClassService,
  LiveClassStatus,
  CreateLiveClassInput,
  UpdateLiveClassInput
} from '../services/liveClass.service.js'
import { getSocketServer } from '../lib/socket.io.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassStatusEnum = z.enum(['SCHEDULED', 'ONGOING', 'PAST', 'CANCELLED'])

const liveClassQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: z
    .union([
      liveClassStatusEnum,
      z
        .string()
        .transform((value) => value.split(',').filter(Boolean))
        .pipe(z.array(liveClassStatusEnum))
    ])
    .optional(),
  search: z.string().optional(),
  includePast: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : undefined)),
  offset: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : undefined)),
  sortBy: z.enum(['start_time', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createLiveClassSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  courseId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
})

const updateLiveClassSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  courseId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: liveClassStatusEnum.optional(),
  recordingUrl: z.string().url().optional(),
  isRecorded: z.boolean().optional(),
  recordingAvailableForStudents: z.boolean().optional()
})

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid()
})

// --- API Routes ---

/**
 * GET /api/live-classes
 * List all live classes with filters
 */
router.get(
  '/',
  requireAuth,
  validateQuery(liveClassQuerySchema.partial()),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof liveClassQuerySchema>
    const teacherId = (req as any).user?.id // Assuming user ID is available on req.user

    // If a teacher is requesting, default to their classes unless explicitly filtered otherwise
    if ((req as any).user?.role === 'teacher' && !filters.teacherId) {
      filters.teacherId = teacherId
    }

    const liveClasses = await LiveClassService.listLiveClasses(filters)
    res.json({ items: liveClasses })
  })
)

/**
 * POST /api/live-classes
 * Create a new live class
 */
router.post(
  '/',
  requireAuth,
  requireTeacher, // Only teachers can create live classes
  validateBody(createLiveClassSchema),
  asyncHandler(async (req, res) => {
    const teacherEmail = (req as any).user?.email // Use email instead of ID
    const body = req.body as z.infer<typeof createLiveClassSchema>

    if (!teacherEmail) {
      throw createHttpError(401, 'teacher_email_required')
    }

    const payload: CreateLiveClassInput = {
      title: body.title,
      description: body.description,
      courseId: body.courseId,
      startTime: body.startTime,
      endTime: body.endTime
    }

    const newLiveClass = await LiveClassService.createLiveClass(teacherEmail, payload)
    res.status(201).json(newLiveClass)
  })
)

/**
 * GET /api/live-classes/:liveClassId
 * Get details of a specific live class
 */
router.get(
  '/:liveClassId',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const actorId = (req as any).user?.id // Assuming user ID is available on req.user
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>

    const liveClass = await LiveClassService.getLiveClass(liveClassId, actorId)
    res.json(liveClass)
  })
)

/**
 * PATCH /api/live-classes/:liveClassId
 * Update an existing live class
 */
router.patch(
  '/:liveClassId',
  requireAuth,
  requireTeacher, // Only teachers can update live classes
  validateParams(liveClassIdParams),
  validateBody(updateLiveClassSchema),
  asyncHandler(async (req, res) => {
    const teacherId = (req as any).user?.id // Assuming user ID is available on req.user
    const teacherEmail = (req as any).user?.email
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const body = req.body as z.infer<typeof updateLiveClassSchema>

    const payload: UpdateLiveClassInput = {
      title: body.title,
      description: body.description,
      courseId: body.courseId,
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status,
      recordingUrl: body.recordingUrl,
      isRecorded: body.isRecorded,
      recordingAvailableForStudents: body.recordingAvailableForStudents
    }

    const updatedLiveClass = await LiveClassService.updateLiveClass(
      liveClassId,
      teacherId,
      payload,
      teacherEmail
    )
    res.json(updatedLiveClass)
  })
)

/**
 * DELETE /api/live-classes/:liveClassId
 * Delete a live class
 */
router.delete(
  '/:liveClassId',
  requireAuth,
  requireTeacher, // Only teachers can delete live classes
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const teacherId = (req as any).user?.id // Assuming user ID is available on req.user
    const teacherEmail = (req as any).user?.email
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>

    const result = await LiveClassService.deleteLiveClass(liveClassId, teacherId, teacherEmail)
    res.json(result)
  })
)

/**
 * POST /api/live-classes/:liveClassId/start
 * Start a live class (change status to ONGOING)
 */
router.post(
  '/:liveClassId/start',
  requireAuth,
  requireTeacher, // Only teachers can start live classes
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const teacherId = (req as any).user?.id
    const teacherEmail = (req as any).user?.email
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>

    const startedLiveClass = await LiveClassService.startLiveClass(liveClassId, teacherId, teacherEmail)
    
    // Emit socket event to notify all users
    const io = getSocketServer()
    if (io) {
      io.emit('live_class_status_changed', {
        liveClassId,
        status: 'ONGOING',
        liveClass: startedLiveClass
      })
    }
    
    res.json(startedLiveClass)
  })
)

/**
 * POST /api/live-classes/:liveClassId/end
 * End a live class (change status to PAST)
 */
router.post(
  '/:liveClassId/end',
  requireAuth,
  requireTeacher, // Only teachers can end live classes
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const teacherId = (req as any).user?.id
    const teacherEmail = (req as any).user?.email
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>

    const endedLiveClass = await LiveClassService.endLiveClass(liveClassId, teacherId, teacherEmail)
    
    // Emit socket event to notify all users
    const io = getSocketServer()
    if (io) {
      io.emit('live_class_status_changed', {
        liveClassId,
        status: 'PAST',
        liveClass: endedLiveClass
      })
      // Also emit to the specific room
      io.to(liveClassId).emit('class_ended', { liveClassId })
    }
    
    res.json(endedLiveClass)
  })
)

/**
 * GET /api/live-classes/:liveClassId/participants
 * Get participants for a live class
 */
router.get(
  '/:liveClassId/participants',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const { ParticipantService } = await import('../services/participant.service.js')
    try {
      const participants = await ParticipantService.getParticipants(liveClassId)
      res.json({ items: participants })
    } catch (error) {
      console.error('Error fetching participants:', error)
      res.status(500).json({ error: 'Failed to fetch participants' })
    }
  })
)

/**
 * GET /api/live-classes/:liveClassId/recordings
 * Get recordings for a live class
 */
router.get(
  '/:liveClassId/recordings',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const { supabaseAdmin } = await import('../lib/supabase.js')

    const { data: recordings, error } = await supabaseAdmin
      .from('live_class_recordings')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recordings:', error)
      return res.status(500).json({ error: 'Failed to fetch recordings' })
    }

    res.json({ items: recordings || [] })
  })
)

/**
 * POST /api/live-classes/:liveClassId/recordings/start
 * Start recording a live class
 */
router.post(
  '/:liveClassId/recordings/start',
  requireAuth,
  requireTeacher,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const teacherId = (req as any).user?.id
    const { channelName, uid } = req.body

    // Verify teacher owns this class
    await LiveClassService.getLiveClass(liveClassId, teacherId)

    // TODO: Implement Agora Cloud Recording start
    // For now, return a placeholder response
    res.json({
      agoraSid: `sid-${Date.now()}`,
      resourceId: `rid-${Date.now()}`,
      message: 'Recording start endpoint - Agora integration pending'
    })
  })
)

/**
 * POST /api/live-classes/:liveClassId/recordings/stop
 * Stop recording a live class
 */
router.post(
  '/:liveClassId/recordings/stop',
  requireAuth,
  requireTeacher,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const teacherId = (req as any).user?.id
    const { agoraSid, resourceId, channelName, uid } = req.body

    // Verify teacher owns this class
    await LiveClassService.getLiveClass(liveClassId, teacherId)

    // TODO: Implement Agora Cloud Recording stop
    // For now, return a placeholder response
    res.json({
      message: 'Recording stop endpoint - Agora integration pending',
      recordingUrl: null
    })
  })
)

export { router as liveClassesRoutes }
