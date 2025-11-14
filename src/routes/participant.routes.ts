import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth.js'
import { validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ParticipantService } from '../services/participant.service.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/participants
 * Get participants for a specific live class
 */
router.get(
  '/live-classes/:liveClassId/participants',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const participants = await ParticipantService.getParticipants(liveClassId)
    res.json({ items: participants })
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as participantRoutes }
