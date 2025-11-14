import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { validateBody, validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ResourceService, CreateLiveClassResourceInput, UpdateLiveClassResourceInput } from '../services/resource.service.js'

const router = Router()

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/temp/' }) // Temporary directory for uploads

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

const resourceIdParams = z.object({
  resourceId: z.string().uuid(),
})

const createResourceSchema = z.object({
  title: z.string().min(1).max(255),
  url: z.string().url().optional(),
  // File is handled by multer, not directly in body validation
})

const updateResourceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  url: z.string().url().nullable().optional(), // Nullable to allow removing URL
  removeFile: z.boolean().optional(), // Flag to remove existing file
  // File is handled by multer, not directly in body validation
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/resources
 * List all resources for a specific live class
 */
router.get(
  '/live-classes/:liveClassId/resources',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const resources = await ResourceService.getLiveClassResources(liveClassId)
    res.json({ items: resources })
  })
)

/**
 * POST /api/live-classes/:liveClassId/resources
 * Create a new resource for a live class (can be a link or an uploaded file)
 */
router.post(
  '/live-classes/:liveClassId/resources',
  requireAuth,
  requireTeacher, // Only teachers can add resources
  upload.single('file'), // Multer middleware for file upload
  validateParams(liveClassIdParams),
  validateBody(createResourceSchema.partial()), // Use partial as file is not in body
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const teacherId = (req as any).user?.id
    const { title, url } = req.body as z.infer<typeof createResourceSchema>

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const payload: CreateLiveClassResourceInput = {
      liveClassId,
      teacherId,
      title,
      url: url || undefined,
      file: req.file ? { path: req.file.path, originalname: req.file.originalname } : undefined,
    }

    if (!payload.url && !payload.file) {
      throw createHttpError(400, 'Resource must have either a URL or an uploaded file.')
    }

    const newResource = await ResourceService.createResource(payload)
    res.status(201).json(newResource)
  })
)

/**
 * PATCH /api/resources/:resourceId
 * Update an existing resource (can update link, title, or replace/remove file)
 */
router.patch(
  '/resources/:resourceId',
  requireAuth,
  requireTeacher, // Only teachers can update resources
  upload.single('file'), // Multer middleware for file upload
  validateParams(resourceIdParams),
  validateBody(updateResourceSchema.partial()), // Use partial as file is not in body
  asyncHandler(async (req, res) => {
    const { resourceId } = req.params as z.infer<typeof resourceIdParams>
    const teacherId = (req as any).user?.id
    const { title, url, removeFile } = req.body as z.infer<typeof updateResourceSchema>

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const normalizedRemoveFile =
      typeof removeFile === 'string'
        ? removeFile === 'true'
        : Boolean(removeFile)

    const payload: UpdateLiveClassResourceInput = {
      title,
      url: url === 'null' ? null : url, // Handle 'null' string from form data
      removeFile: normalizedRemoveFile,
      file: req.file ? { path: req.file.path, originalname: req.file.originalname } : undefined,
    }

    const updatedResource = await ResourceService.updateResource(resourceId, teacherId, payload)
    res.json(updatedResource)
  })
)

/**
 * DELETE /api/resources/:resourceId
 * Delete a resource
 */
router.delete(
  '/resources/:resourceId',
  requireAuth,
  requireTeacher, // Only teachers can delete resources
  validateParams(resourceIdParams),
  asyncHandler(async (req, res) => {
    const { resourceId } = req.params as z.infer<typeof resourceIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const result = await ResourceService.deleteResource(resourceId, teacherId)
    res.json(result)
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as resourceRoutes }
