import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTeacher } from '../middlewares/auth.js'
import { validateParams } from '../middlewares/validation.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AttendanceService } from '../services/attendance.service.js'

const router = Router()

// --- Zod Schemas for Validation ---

const liveClassIdParams = z.object({
  liveClassId: z.string().uuid(),
})

// --- API Routes ---

/**
 * GET /api/live-classes/:liveClassId/attendance
 * Get attendance records for a specific live class (Teacher only)
 */
router.get(
  '/live-classes/:liveClassId/attendance',
  requireAuth,
  requireTeacher, // Only teachers can view attendance
  validateParams(liveClassIdParams),
  asyncHandler(async (req, res) => {
    const { liveClassId } = req.params as z.infer<typeof liveClassIdParams>
    const attendanceRecords = await AttendanceService.getAttendanceRecords(liveClassId)
    res.json({ items: attendanceRecords })
  })
)

// Utility function for consistent error handling (copied from services)
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export { router as attendanceRoutes }
