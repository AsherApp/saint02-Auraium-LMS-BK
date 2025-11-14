import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { validateBody, validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { QuizService, CreateLiveClassQuizInput, SubmitQuizInput } from '../services/quiz.service.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

const quizIdParams = z.object({
  quizId: z.string().uuid(),
})

const createQuizQuestionSchema = z.object({
  questionText: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctOptionIndex: z.number().int().min(0),
})

const createQuizSchema = z.object({
  title: z.string().min(1).max(255),
  questions: z.array(createQuizQuestionSchema).min(1),
  showResultsAfterSubmission: z.boolean().default(false),
})

const submitQuizSchema = z.object({
  answers: z.array(z.number().int()), // Array of selected option indices
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/quizzes
 * List all quizzes for a specific live class
 */
router.get(
  '/live-classes/:liveClassId/quizzes',
  requireAuth,
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const quizzes = await QuizService.getQuizzes(liveClassId)
    res.json({ items: quizzes })
  })
)

/**
 * GET /api/quizzes/:quizId
 * Get a specific quiz by ID
 */
router.get(
  '/quizzes/:quizId',
  requireAuth,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const quiz = await QuizService.getQuizById(quizId)
    res.json(quiz)
  })
)

/**
 * GET /api/quizzes/:quizId/submissions
 * Get all submissions for a specific quiz (Teacher only)
 */
router.get(
  '/quizzes/:quizId/submissions',
  requireAuth,
  requireTeacher,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const submissions = await QuizService.getQuizSubmissions(quizId)
    res.json({ items: submissions })
  })
)

/**
 * GET /api/quizzes/:quizId/my-submission
 * Get current student's submission for a specific quiz
 */
router.get(
  '/quizzes/:quizId/my-submission',
  requireAuth,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const studentId = (req as any).user?.id

    if (!studentId) {
      throw createHttpError(401, 'Authentication required: Student ID not found.')
    }

    const submission = await QuizService.getStudentSubmission(quizId, studentId)
    res.json(submission)
  })
)

/**
 * POST /api/live-classes/:liveClassId/quizzes
 * Create a new quiz for a live class (Teacher only)
 */
router.post(
  '/live-classes/:liveClassId/quizzes',
  requireAuth,
  requireTeacher,
  validateParams(liveClassIdParams),
  validateBody(createQuizSchema),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const teacherId = (req as any).user?.id
    const { title, questions, showResultsAfterSubmission } = req.body as z.infer<typeof createQuizSchema>

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const payload: CreateLiveClassQuizInput = {
      liveClassId,
      teacherId,
      title,
      questions: questions?.filter(q => q.questionText) as any,
      showResultsAfterSubmission,
    }

    const newQuiz = await QuizService.createQuiz(payload)
    res.status(201).json(newQuiz)
  })
)

/**
 * POST /api/quizzes/:quizId/activate
 * Activate a quiz (Teacher only)
 */
router.post(
  '/quizzes/:quizId/activate',
  requireAuth,
  requireTeacher,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const activatedQuiz = await QuizService.activateQuiz(quizId, teacherId)
    res.json(activatedQuiz)
  })
)

/**
 * POST /api/quizzes/:quizId/deactivate
 * Deactivate a quiz (Teacher only)
 */
router.post(
  '/quizzes/:quizId/deactivate',
  requireAuth,
  requireTeacher,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const deactivatedQuiz = await QuizService.deactivateQuiz(quizId, teacherId)
    res.json(deactivatedQuiz)
  })
)

/**
 * POST /api/quizzes/:quizId/submit
 * Submit a quiz (Student only)
 */
router.post(
  '/quizzes/:quizId/submit',
  requireAuth,
  validateParams(quizIdParams),
  validateBody(submitQuizSchema),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const studentId = (req as any).user?.id
    const { answers } = req.body as z.infer<typeof submitQuizSchema>

    if (!studentId) {
      throw createHttpError(401, 'Authentication required: Student ID not found.')
    }

    const payload: SubmitQuizInput = {
      quizId,
      studentId,
      answers,
    }

    const newSubmission = await QuizService.submitQuiz(payload)
    res.status(201).json(newSubmission)
  })
)

/**
 * DELETE /api/quizzes/:quizId
 * Delete a quiz (Teacher only)
 */
router.delete(
  '/quizzes/:quizId',
  requireAuth,
  requireTeacher,
  validateParams(quizIdParams),
  asyncHandler(async (req, res) => {
    const { quizId } = req.params as z.infer<typeof quizIdParams>
    const teacherId = (req as any).user?.id

    if (!teacherId) {
      throw createHttpError(401, 'Authentication required: Teacher ID not found.')
    }

    const result = await QuizService.deleteQuiz(quizId, teacherId)
    res.json(result)
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as quizRoutes }
