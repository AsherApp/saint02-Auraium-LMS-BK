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
  ForumService,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateThreadInput,
  UpdateThreadInput,
  CreatePostInput,
  UpdatePostInput
} from '../services/forum.service.js'

const router = Router()

const visibilityEnum = z.enum(['course', 'institution', 'public'])

const categoryQuerySchema = z.object({
  contextType: z.string().optional(),
  contextId: z.string().uuid().optional(),
  includeLocked: z.enum(['true', 'false']).optional().transform((value) => value === 'true')
})

const categoryBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  context: z
    .object({
      type: z.string().min(1),
      id: z.string().uuid()
    })
    .optional(),
  visibility: visibilityEnum.optional(),
  metadata: z.record(z.any()).optional()
})

const categoryUpdateSchema = categoryBodySchema
  .extend({
    isLocked: z.boolean().optional()
  })
  .partial()

const threadQuerySchema = z.object({
  includeLocked: z.enum(['true', 'false']).optional().transform((value) => value === 'true')
})

const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  richContent: z.record(z.any()).optional(),
  context: z
    .object({
      type: z.string().min(1),
      id: z.string().uuid()
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
  subscribe: z.boolean().optional()
})

const updateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  richContent: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
})

const createPostSchema = z.object({
  content: z.string().min(1),
  richContent: z.record(z.any()).optional(),
  parentPostId: z.string().uuid().optional()
})

const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  richContent: z.record(z.any()).optional()
})

const categoryParamsSchema = z.object({
  categoryId: z.string().uuid()
})

const threadParamsSchema = z.object({
  threadId: z.string().uuid()
})

const postParamsSchema = z.object({
  threadId: z.string().uuid(),
  postId: z.string().uuid()
})

router.get(
  '/categories',
  requireAuth,
  validateQuery(categoryQuerySchema.partial()),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof categoryQuerySchema>
    const items = await ForumService.listCategories(filters)
    res.json({ items })
  })
)

router.post(
  '/categories',
  requireAuth,
  requireTeacher,
  validateBody(categoryBodySchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const body = req.body as z.infer<typeof categoryBodySchema>

    const payload: CreateCategoryInput = {
      title: body.title,
      description: body.description,
      contextType: body.context?.type,
      contextId: body.context?.id,
      visibility: body.visibility,
      metadata: body.metadata
    }

    const result = await ForumService.createCategory(userEmail, payload)
    res.status(201).json(result)
  })
)

router.patch(
  '/categories/:categoryId',
  requireAuth,
  requireTeacher,
  validateParams(categoryParamsSchema),
  validateBody(categoryUpdateSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { categoryId } = req.params as z.infer<typeof categoryParamsSchema>
    const body = req.body as z.infer<typeof categoryUpdateSchema>

    const payload: UpdateCategoryInput = {
      title: body.title,
      description: body.description,
      contextType: body.context?.type,
      contextId: body.context?.id,
      visibility: body.visibility,
      metadata: body.metadata,
      isLocked: body.isLocked
    }

    const result = await ForumService.updateCategory(categoryId, userEmail, payload)
    res.json(result)
  })
)

router.delete(
  '/categories/:categoryId',
  requireAuth,
  requireTeacher,
  validateParams(categoryParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { categoryId } = req.params as z.infer<typeof categoryParamsSchema>

    const result = await ForumService.deleteCategory(categoryId, userEmail)
    res.json(result)
  })
)

router.get(
  '/categories/:categoryId/threads',
  requireAuth,
  validateParams(categoryParamsSchema),
  validateQuery(threadQuerySchema.partial()),
  asyncHandler(async (req, res) => {
    const { categoryId } = req.params as z.infer<typeof categoryParamsSchema>
    const filters = req.query as unknown as z.infer<typeof threadQuerySchema>

    const items = await ForumService.listThreads({
      categoryId,
      includeLocked: filters.includeLocked
    })

    res.json({ items })
  })
)

router.post(
  '/categories/:categoryId/threads',
  requireAuth,
  validateParams(categoryParamsSchema),
  validateBody(createThreadSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { categoryId } = req.params as z.infer<typeof categoryParamsSchema>
    const body = req.body as z.infer<typeof createThreadSchema>

    const payload: CreateThreadInput = {
      categoryId,
      title: body.title,
      content: body.content,
      richContent: body.richContent,
      contextType: body.context?.type,
      contextId: body.context?.id,
      metadata: body.metadata,
      subscribe: body.subscribe
    }

    const result = await ForumService.createThread(userEmail, payload)
    res.status(201).json(result)
  })
)

router.get(
  '/threads/:threadId',
  requireAuth,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>

    const result = await ForumService.getThreadDetail(threadId, userEmail)
    res.json(result)
  })
)

router.patch(
  '/threads/:threadId',
  requireAuth,
  validateParams(threadParamsSchema),
  validateBody(updateThreadSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const body = req.body as z.infer<typeof updateThreadSchema>

    const payload: UpdateThreadInput = {
      title: body.title,
      content: body.content,
      richContent: body.richContent,
      metadata: body.metadata
    }

    const result = await ForumService.updateThread(threadId, userEmail, payload)
    res.json(result)
  })
)

router.delete(
  '/threads/:threadId',
  requireAuth,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>

    const result = await ForumService.deleteThread(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/posts',
  requireAuth,
  validateParams(threadParamsSchema),
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const body = req.body as z.infer<typeof createPostSchema>

    const payload: CreatePostInput = {
      content: body.content,
      richContent: body.richContent,
      parentPostId: body.parentPostId
    }

    const result = await ForumService.addPost(threadId, userEmail, payload)
    res.status(201).json(result)
  })
)

router.patch(
  '/threads/:threadId/posts/:postId',
  requireAuth,
  validateParams(postParamsSchema),
  validateBody(updatePostSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId, postId } = req.params as z.infer<typeof postParamsSchema>
    const body = req.body as z.infer<typeof updatePostSchema>

    const payload: UpdatePostInput = {
      content: body.content,
      richContent: body.richContent
    }

    const result = await ForumService.updatePost(threadId, postId, userEmail, payload)
    res.json(result)
  })
)

router.delete(
  '/threads/:threadId/posts/:postId',
  requireAuth,
  validateParams(postParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId, postId } = req.params as z.infer<typeof postParamsSchema>

    const result = await ForumService.deletePost(threadId, postId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/pin',
  requireAuth,
  requireTeacher,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.pinThread(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/unpin',
  requireAuth,
  requireTeacher,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.unpinThread(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/lock',
  requireAuth,
  requireTeacher,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.lockThread(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/unlock',
  requireAuth,
  requireTeacher,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.unlockThread(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/subscribe',
  requireAuth,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.subscribe(threadId, userEmail)
    res.json(result)
  })
)

router.post(
  '/threads/:threadId/unsubscribe',
  requireAuth,
  validateParams(threadParamsSchema),
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email
    const { threadId } = req.params as z.infer<typeof threadParamsSchema>
    const result = await ForumService.unsubscribe(threadId, userEmail)
    res.json(result)
  })
)

export { router }

