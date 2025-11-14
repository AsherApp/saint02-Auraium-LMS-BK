import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { RecordingService } from '../services/recording.service.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

const agoraRecordingParams = z.object({
  agoraSid: z.string(),
  resourceId: z.string(),
})

const startRecordingSchema = z.object({
  liveClassId: z.string().uuid(),
  channelName: z.string(),
  uid: z.string(), // Teacher's UID in Agora
})

const stopRecordingSchema = z.object({
  liveClassId: z.string().uuid(),
  agoraSid: z.string(),
  resourceId: z.string(),
  channelName: z.string(),
  uid: z.string(), // Teacher's UID in Agora
})

const queryRecordingQuery = z.object({
  uid: z.string(), // Teacher's UID in Agora
})

// --- API Routes ---

/**
 * POST /api/live-classes/:liveClassId/recordings/start
 * Start Agora.io cloud recording for a live class (Teacher only)
 */
router.post(
  '/live-classes/:liveClassId/recordings/start',
  requireAuth,
  requireTeacher,
  validateParams(liveClassIdParams),
  validateBody(startRecordingSchema),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const { channelName, uid } = req.body as z.infer<typeof startRecordingSchema>

    const { agoraSid, resourceId } = await RecordingService.startRecording({
      liveClassId,
      channelName,
      uid,
    })

    res.status(200).json({ message: 'Recording started', agoraSid, resourceId })
  })
)

/**
 * POST /api/live-classes/:liveClassId/recordings/stop
 * Stop Agora.io cloud recording for a live class (Teacher only)
 */
router.post(
  '/live-classes/:liveClassId/recordings/stop',
  requireAuth,
  requireTeacher,
  validateParams(liveClassIdParams),
  validateBody(stopRecordingSchema),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const { agoraSid, resourceId, channelName, uid } = req.body as z.infer<typeof stopRecordingSchema>

    await RecordingService.stopRecording({
      liveClassId,
      agoraSid,
      resourceId,
      channelName,
      uid,
    })

    res.status(200).json({ message: 'Recording stopped and metadata updated.' })
  })
)

/**
 * GET /api/live-classes/:liveClassId/recordings
 * Get all recording records for a specific live class (Teacher and Student)
 */
router.get(
  '/live-classes/:liveClassId/recordings',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const recordings = await RecordingService.getRecordingsByLiveClassId(liveClassId)
    res.status(200).json({ items: recordings })
  })
)

/**
 * GET /api/recordings/:agoraSid/:resourceId/query
 * Query Agora.io cloud recording status (Teacher only)
 */
router.get(
  '/recordings/:agoraSid/:resourceId/query',
  requireAuth,
  requireTeacher,
  validateParams(agoraRecordingParams),
  validateQuery(queryRecordingQuery),
  asyncHandler(async (req, res) => {
    const { agoraSid, resourceId } = req.params as z.infer<typeof agoraRecordingParams>
    const { uid } = req.query as z.infer<typeof queryRecordingQuery>

    const recordingStatus = await RecordingService.queryRecording({
      agoraSid,
      resourceId,
      uid,
    })

    res.status(200).json(recordingStatus)
  })
)

/**
 * GET /api/recordings/student
 * Get recordings accessible to the current student
 * NOTE: This must come BEFORE /api/recordings/:recordingId routes
 */
router.get(
  '/student',
  requireAuth,
  asyncHandler(async (req, res) => {
    const studentEmail = (req as any).user?.email
    
    if (!studentEmail) {
      throw createHttpError(401, 'Authentication required: Student email not found.')
    }

    const recordings = await RecordingService.getStudentRecordings(studentEmail)
    res.status(200).json(recordings)
  })
)

const recordingIdParams = z.object({
  recordingId: z.string().uuid(),
})

/**
 * POST /api/recordings/:recordingId/bookmark
 * Bookmark a recording
 * NOTE: Requires recording_bookmarks table (see recording_bookmarks_migration.sql)
 */
router.post(
  '/:recordingId/bookmark',
  requireAuth,
  validateParams(recordingIdParams),
  asyncHandler(async (req, res) => {
    const { recordingId } = req.params as z.infer<typeof recordingIdParams>
    const userEmail = (req as any).user?.email

    if (!userEmail) {
      throw createHttpError(401, 'Authentication required: User email not found.')
    }

    // Add bookmark (upsert to handle duplicates gracefully)
    // Foreign key constraint will ensure recording exists
    const { error: bookmarkError } = await supabaseAdmin
      .from('recording_bookmarks')
      .upsert({ user_email: userEmail, recording_id: recordingId }, { onConflict: 'user_email,recording_id' })

    if (bookmarkError) {
      console.error('Error bookmarking recording:', bookmarkError)
      // Check if it's a foreign key violation (recording doesn't exist)
      if (bookmarkError.code === '23503') {
        throw createHttpError(404, 'Recording not found')
      }
      throw createHttpError(500, 'Failed to bookmark recording')
    }

    res.status(200).json({ message: 'Recording bookmarked', recordingId })
  })
)

/**
 * POST /api/recordings/:recordingId/unbookmark
 * Remove bookmark from a recording
 */
router.post(
  '/:recordingId/unbookmark',
  requireAuth,
  validateParams(recordingIdParams),
  asyncHandler(async (req, res) => {
    const { recordingId } = req.params as z.infer<typeof recordingIdParams>
    const userEmail = (req as any).user?.email

    if (!userEmail) {
      throw createHttpError(401, 'Authentication required: User email not found.')
    }

    // Remove bookmark
    const { error: unbookmarkError } = await supabaseAdmin
      .from('recording_bookmarks')
      .delete()
      .eq('user_email', userEmail)
      .eq('recording_id', recordingId)

    if (unbookmarkError) {
      console.error('Error removing bookmark:', unbookmarkError)
      throw createHttpError(500, 'Failed to remove bookmark')
    }

    res.status(200).json({ message: 'Bookmark removed', recordingId })
  })
)

/**
 * GET /api/recordings
 * Get all recordings (Teacher only)
 * NOTE: This must come LAST as it's the most generic route
 */
router.get(
  '/',
  requireAuth,
  requireTeacher,
  asyncHandler(async (req, res) => {
    const recordings = await RecordingService.getAllRecordings()
    res.status(200).json({ items: recordings })
  })
)

// Import createHttpError for use in routes
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as recordingRoutes }
