import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth.js'
import { validateBody, validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { NotesService, CreateLiveClassNoteInput, UpdateLiveClassNoteInput } from '../services/notes.service'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

const noteIdParams = z.object({
  noteId: z.string().uuid(),
})

const createNoteSchema = z.object({
  content: z.string().min(1),
})

const updateNoteSchema = z.object({
  content: z.string().min(1),
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/notes
 * List all notes for a specific live class
 */
router.get(
  '/live-classes/:liveClassId/notes',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const notes = await NotesService.getNotes(liveClassId)
    res.json({ items: notes })
  })
)

/**
 * POST /api/live-classes/:liveClassId/notes
 * Create a new note for a live class
 */
router.post(
  '/live-classes/:liveClassId/notes',
  requireAuth,
  validateParams(liveClassIdParams),
  validateBody(createNoteSchema),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const authorId = (req as any).user?.id // Assuming user ID is available on req.user
    const authorEmail = (req as any).user?.email // Assuming user email is available on req.user
    const { content } = req.body as z.infer<typeof createNoteSchema>

    if (!authorId || !authorEmail) {
      throw createHttpError(401, 'Authentication required: User ID or Email not found.')
    }

    const payload: CreateLiveClassNoteInput = {
      liveClassId,
      authorId,
      authorEmail,
      content,
    }

    const newNote = await NotesService.createNote(payload)
    res.status(201).json(newNote)
  })
)

/**
 * PATCH /api/notes/:noteId
 * Update an existing note
 */
router.patch(
  '/notes/:noteId',
  requireAuth,
  validateParams(noteIdParams),
  validateBody(updateNoteSchema),
  asyncHandler(async (req, res) => {
    const { noteId } = req.params as z.infer<typeof noteIdParams>
    const authorId = (req as any).user?.id // Assuming user ID is available on req.user
    const { content } = req.body as z.infer<typeof updateNoteSchema>

    if (!authorId) {
      throw createHttpError(401, 'Authentication required: User ID not found.')
    }

    const payload: UpdateLiveClassNoteInput = { content }

    const updatedNote = await NotesService.updateNote(noteId, authorId, payload)
    res.json(updatedNote)
  })
)

/**
 * DELETE /api/notes/:noteId
 * Delete a note
 */
router.delete(
  '/notes/:noteId',
  requireAuth,
  validateParams(noteIdParams),
  asyncHandler(async (req, res) => {
    const { noteId } = req.params as z.infer<typeof noteIdParams>
    const authorId = (req as any).user?.id // Assuming user ID is available on req.user

    if (!authorId) {
      throw createHttpError(401, 'Authentication required: User ID not found.')
    }

    const result = await NotesService.deleteNote(noteId, authorId)
    res.json(result)
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as notesRoutes }