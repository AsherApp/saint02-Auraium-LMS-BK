import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth.js'
import {
  emailSchema,
  validateBody,
  validateParams,
  validateQuery
} from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  DiscussionService,
  CreateDiscussionInput,
  UpdateDiscussionInput,
  CreatePostInput,
  UpdatePostInput
} from '../services/discussion.service'

const router = Router()

const discussionTypeEnum = z.enum([
  'direct',
  'course',
  'study_group_student',
  'study_group_course',
  'forum_bridge'
])

const visibilityEnum = z.enum(['private', 'course', 'institution'])

const participantRoleEnum = z.enum(['owner', 'moderator', 'participant', 'leader', 'co_leader'])

const attachmentSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional()
})

const discussionListQuerySchema = z
  .object({
    discussionType: discussionTypeEnum.optional(),
    visibility: visibilityEnum.optional(),
    contextType: z.string().optional(),
    contextId: z.string().uuid().optional(),
    studyGroup: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
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
      .transform((value) => (value ? parseInt(value, 10) : undefined))
  })
  .partial()

const createDiscussionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  discussionType: discussionTypeEnum,
  visibility: visibilityEnum.optional(),
  context: z
    .object({
      type: z.string().min(1),
      id: z.string().uuid()
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
  participants: z
    .array(
      z.object({
        email: emailSchema,
        role: participantRoleEnum.optional()
      })
    )
    .optional(),
  initialMessage: z
    .object({
      content: z.string().min(1),
      richContent: z.record(z.any()).optional(),
      mentions: z.array(z.string()).optional(),
      attachments: z.array(attachmentSchema).optional()
    })
    .optional()
})

const discussionIdParamsSchema = z.object({
  discussionId: z.string().uuid()
})

const discussionPostParamsSchema = z.object({
  discussionId: z.string().uuid(),
  postId: z.string().uuid()
})

const updateDiscussionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  visibility: visibilityEnum.optional(),
  isArchived: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  allowTeacherOverride: z.boolean().optional()
})

const participantUpdateSchema = z.object({
  participants: z
    .array(
      z.object({
        email: emailSchema,
        role: participantRoleEnum.optional()
      })
    )
    .min(1)
})

const createPostSchema = z.object({
  content: z.string().min(1),
  richContent: z.record(z.any()).optional(),
  parentPostId: z.string().uuid().optional(),
  mentions: z.array(z.string()).optional(),
  attachments: z.array(attachmentSchema).optional()
})

const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  richContent: z.record(z.any()).optional(),
  mentions: z.array(z.string()).optional()
})

router.get(
  '/',
  requireAuth,
  validateQuery(discussionListQuerySchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const filters = (req.query || {}) as z.infer<typeof discussionListQuerySchema>

    const items = await DiscussionService.listDiscussions(userEmail, {
      discussionType: filters.discussionType,
      visibility: filters.visibility,
      contextType: filters.contextType,
      contextId: filters.contextId,
      studyGroup: filters.studyGroup,
      search: filters.search,
      limit: filters.limit,
      offset: filters.offset
    })

    res.json({ items })
  })
)

router.post(
  '/',
  requireAuth,
  validateBody(createDiscussionSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const userRole = (req as any).user?.role || 'teacher'
    const body = req.body as z.infer<typeof createDiscussionSchema>

    const payload: CreateDiscussionInput = {
      title: body.title,
      description: body.description,
      discussionType: body.discussionType,
      visibility: body.visibility,
      contextType: body.context?.type,
      contextId: body.context?.id,
      metadata: body.metadata,
      participants: body.participants,
      initialMessage: body.initialMessage
    }

    const result = await DiscussionService.createDiscussion(userEmail, userRole, payload)
    res.status(201).json(result)
  })
)

router.get(
  '/:discussionId',
  requireAuth,
  validateParams(discussionIdParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId } = req.params as z.infer<typeof discussionIdParamsSchema>

    const result = await DiscussionService.getDiscussionDetail(discussionId, userEmail)
    res.json(result)
  })
)

router.patch(
  '/:discussionId',
  requireAuth,
  validateParams(discussionIdParamsSchema),
  validateBody(updateDiscussionSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId } = req.params as z.infer<typeof discussionIdParamsSchema>
    const body = req.body as z.infer<typeof updateDiscussionSchema>

    const payload: UpdateDiscussionInput = {
      title: body.title,
      description: body.description,
      visibility: body.visibility,
      isArchived: body.isArchived,
      metadata: body.metadata,
      allowTeacherOverride: body.allowTeacherOverride
    }

    const result = await DiscussionService.updateDiscussion(discussionId, userEmail, payload)
    res.json(result)
  })
)

router.post(
  '/:discussionId/participants',
  requireAuth,
  validateParams(discussionIdParamsSchema),
  validateBody(participantUpdateSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId } = req.params as z.infer<typeof discussionIdParamsSchema>
    const body = req.body as z.infer<typeof participantUpdateSchema>

    const result = await DiscussionService.addParticipants(discussionId, userEmail, body.participants)
    res.json(result)
  })
)

router.post(
  '/:discussionId/posts',
  requireAuth,
  validateParams(discussionIdParamsSchema),
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId } = req.params as z.infer<typeof discussionIdParamsSchema>
    const body = req.body as z.infer<typeof createPostSchema>

    const payload: CreatePostInput = {
      content: body.content,
      richContent: body.richContent,
      parentPostId: body.parentPostId,
      mentions: body.mentions,
      attachments: body.attachments
    }

    const result = await DiscussionService.addPost(discussionId, userEmail, payload)
    res.status(201).json(result)
  })
)

router.patch(
  '/:discussionId/posts/:postId',
  requireAuth,
  validateParams(discussionPostParamsSchema),
  validateBody(updatePostSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId, postId } = req.params as z.infer<typeof discussionPostParamsSchema>
    const body = req.body as z.infer<typeof updatePostSchema>

    const payload: UpdatePostInput = {
      content: body.content,
      richContent: body.richContent,
      mentions: body.mentions
    }

    const result = await DiscussionService.updatePost(discussionId, postId, userEmail, payload)
    res.json(result)
  })
)

router.delete(
  '/:discussionId/posts/:postId',
  requireAuth,
  validateParams(discussionPostParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId, postId } = req.params as z.infer<typeof discussionPostParamsSchema>

    const result = await DiscussionService.deletePost(discussionId, postId, userEmail)
    res.json(result)
  })
)

router.post(
  '/:discussionId/mark-read',
  requireAuth,
  validateParams(discussionIdParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { discussionId } = req.params as z.infer<typeof discussionIdParamsSchema>

    const result = await DiscussionService.markDiscussionRead(discussionId, userEmail)
    res.json(result)
  })
)

export { router }

