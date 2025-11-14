import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  validateBody,
  validateParams,
  validateQuery
} from '../middlewares/validation.js'
import {
  AnnouncementService,
  CreateAnnouncementInput,
  UpdateAnnouncementInput
} from '../services/announcement.service.js'

const router = Router()

const statusEnum = z.enum(['draft', 'scheduled', 'published', 'cancelled', 'expired'])
const displayEnum = z.enum(['banner', 'modal', 'email'])
const priorityEnum = z.enum(['normal', 'high', 'critical'])

const audienceSchema = z.object({
  audienceType: z.string().min(1),
  audienceId: z.string().uuid().optional(),
  audienceValue: z.string().optional()
})

const recurrenceSchema = z.object({
  rule: z.string().min(1),
  endsAt: z.string().datetime().optional()
})

const announcementQuerySchema = z.object({
  authorEmail: z.string().email().optional(),
  contextType: z.string().optional(),
  contextId: z.string().uuid().optional(),
  status: z
    .union([
      statusEnum,
      z
        .string()
        .transform((value) => value.split(',').filter(Boolean))
        .pipe(z.array(statusEnum))
    ])
    .optional(),
  includeExpired: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
  search: z.string().optional(),
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
  sortBy: z.enum(['starts_at', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  richContent: z.record(z.any()).optional(),
  displayType: displayEnum.optional(),
  priority: priorityEnum.optional(),
  context: z
    .object({
      type: z.string().min(1),
      id: z.string().uuid()
    })
    .optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  recurrence: recurrenceSchema.optional(),
  audience: z.array(audienceSchema).optional(),
  metadata: z.record(z.any()).optional()
})

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  richContent: z.record(z.any()).optional(),
  displayType: displayEnum.optional(),
  priority: priorityEnum.optional(),
  context: z
    .object({
      type: z.string().min(1),
      id: z.string().uuid()
    })
    .optional(),
  startsAt: z.union([z.string().datetime(), z.null()]).optional(),
  endsAt: z.union([z.string().datetime(), z.null()]).optional(),
  status: statusEnum.optional(),
  recurrence: z.union([recurrenceSchema, z.null()]).optional(),
  audience: z.array(audienceSchema).optional(),
  metadata: z.record(z.any()).optional()
})

const announcementIdParams = z.object({
  announcementId: z.string().uuid()
})

router.get(
  '/',
  requireAuth,
  validateQuery(announcementQuerySchema.partial()),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof announcementQuerySchema>

    const items = await AnnouncementService.listAnnouncements({
      authorEmail: filters.authorEmail,
      contextType: filters.contextType,
      contextId: filters.contextId,
      status: filters.status,
      includeExpired: filters.includeExpired,
      search: filters.search,
      limit: filters.limit,
      offset: filters.offset,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })

    res.json({ items })
  })
)

router.post(
  '/',
  requireAuth,
  requireTeacher,
  validateBody(createAnnouncementSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const body = req.body as z.infer<typeof createAnnouncementSchema>

    const payload: CreateAnnouncementInput = {
      title: body.title,
      content: body.content,
      richContent: body.richContent,
      displayType: body.displayType,
      priority: body.priority,
      contextType: body.context?.type,
      contextId: body.context?.id,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      recurrence: body.recurrence && body.recurrence.rule ? {
        rule: body.recurrence.rule,
        endsAt: body.recurrence.endsAt
      } : undefined,
      audience: body.audience?.filter(a => a.audienceType) as any,
      metadata: body.metadata
    }

    const result = await AnnouncementService.createAnnouncement(userEmail, payload)
    res.status(201).json(result)
  })
)

router.get(
  '/:announcementId',
  requireAuth,
  requireTeacher,
  validateParams(announcementIdParams),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>

    const result = await AnnouncementService.getAnnouncement(announcementId, userEmail)
    res.json(result)
  })
)

router.patch(
  '/:announcementId',
  requireAuth,
  requireTeacher,
  validateParams(announcementIdParams),
  validateBody(updateAnnouncementSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>
    const body = req.body as z.infer<typeof updateAnnouncementSchema>

    const payload: UpdateAnnouncementInput = {
      title: body.title,
      content: body.content,
      richContent: body.richContent,
      displayType: body.displayType,
      priority: body.priority,
      contextType: body.context?.type,
      contextId: body.context?.id,
      startsAt: body.startsAt ?? undefined,
      endsAt: body.endsAt ?? undefined,
      status: body.status,
      recurrence: body.recurrence && body.recurrence.rule ? {
        rule: body.recurrence.rule,
        endsAt: body.recurrence.endsAt
      } : undefined,
      audience: body.audience?.filter(a => a.audienceType) as any,
      metadata: body.metadata
    }

    const result = await AnnouncementService.updateAnnouncement(announcementId, userEmail, payload)
    res.json(result)
  })
)

router.delete(
  '/:announcementId',
  requireAuth,
  requireTeacher,
  validateParams(announcementIdParams),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>

    const result = await AnnouncementService.deleteAnnouncement(announcementId, userEmail)
    res.json(result)
  })
)

router.post(
  '/:announcementId/publish-now',
  requireAuth,
  requireTeacher,
  validateParams(announcementIdParams),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>

    const result = await AnnouncementService.publishNow(announcementId, userEmail)
    res.json(result)
  })
)

router.post(
  '/:announcementId/acknowledge',
  requireAuth,
  validateParams(announcementIdParams),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>

    const result = await AnnouncementService.acknowledgeAnnouncement(announcementId, userEmail)
    res.json(result)
  })
)

router.post(
  '/:announcementId/dismiss',
  requireAuth,
  validateParams(announcementIdParams),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { announcementId } = req.params as z.infer<typeof announcementIdParams>

    const result = await AnnouncementService.dismissAnnouncement(announcementId, userEmail)
    res.json(result)
  })
)

export { router }

