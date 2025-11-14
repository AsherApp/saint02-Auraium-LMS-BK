import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { validateBody, validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { PollService, CreateLiveClassPollInput, VoteOnPollInput } from '../services/poll.service.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

const pollIdParams = z.object({
  pollId: z.string().uuid(),
})

const createPollSchema = z.object({
  question: z.string().min(1).max(255),
  options: z.array(z.string().min(1)).min(2).max(10), // At least 2 options, max 10
})

const voteOnPollSchema = z.object({
  optionIndex: z.number().int().min(0),
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/polls
 * List all polls for a specific live class
 */
router.get(
  '/live-classes/:liveClassId/polls',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const polls = await PollService.getPolls(liveClassId)
    res.json({ items: polls })
  })
)

/**
 * GET /api/polls/:pollId
 * Get a specific poll by ID
 */
router.get(
  '/polls/:pollId',
  requireAuth,
  validateParams(pollIdParams),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const poll = await PollService.getPollById(pollId)
    res.json(poll)
  })
)

/**
 * GET /api/polls/:pollId/results
 * Get results for a specific poll
 */
router.get(
  '/polls/:pollId/results',
  requireAuth,
  validateParams(pollIdParams),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const results = await PollService.getPollResults(pollId)
    res.json(results)
  })
)

/**
 * POST /api/live-classes/:liveClassId/polls
 * Create a new poll for a live class
 */
router.post(
  '/live-classes/:liveClassId/polls',
  requireAuth,
  requireTeacher, // Only teachers can create polls
  validateParams(liveClassIdParams),
  validateBody(createPollSchema),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const teacherId = (req as any).user?.id
    const { question, options } = req.body as z.infer<typeof createPollSchema>

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const payload: CreateLiveClassPollInput = {
      liveClassId,
      teacherId,
      question,
      options,
    }

    const newPoll = await PollService.createPoll(payload)
    res.status(201).json(newPoll)
  })
)

/**
 * POST /api/polls/:pollId/activate
 * Activate a poll
 */
router.post(
  '/polls/:pollId/activate',
  requireAuth,
  requireTeacher, // Only teachers can activate polls
  validateParams(pollIdParams),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const activatedPoll = await PollService.activatePoll(pollId, teacherId)
    res.json(activatedPoll)
  })
)

/**
 * POST /api/polls/:pollId/deactivate
 * Deactivate a poll
 */
router.post(
  '/polls/:pollId/deactivate',
  requireAuth,
  requireTeacher, // Only teachers can deactivate polls
  validateParams(pollIdParams),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const deactivatedPoll = await PollService.deactivatePoll(pollId, teacherId)
    res.json(deactivatedPoll)
  })
)

/**
 * POST /api/polls/:pollId/vote
 * Vote on a poll
 */
router.post(
  '/polls/:pollId/vote',
  requireAuth,
  validateParams(pollIdParams),
  validateBody(voteOnPollSchema),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const voterId = (req as any).user?.id
    const { optionIndex } = req.body as z.infer<typeof voteOnPollSchema>

    if (!voterId) {
      throw createHttpError(401, 'Authentication required: Voter ID not found.')
    }

    const payload: VoteOnPollInput = {
      pollId,
      voterId,
      optionIndex,
    }

    const newVote = await PollService.voteOnPoll(payload)
    res.status(201).json(newVote)
  })
)

/**
 * DELETE /api/polls/:pollId
 * Delete a poll
 */
router.delete(
  '/polls/:pollId',
  requireAuth,
  requireTeacher, // Only teachers can delete polls
  validateParams(pollIdParams),
  asyncHandler(async (req, res) => {
    const { pollId } = req.params as z.infer<typeof pollIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const result = await PollService.deletePoll(pollId, teacherId)
    res.json(result)
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as pollRoutes }
