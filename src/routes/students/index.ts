import { Router } from 'express'
import { router as debugRoutes } from './debug.routes.ts'
import { router as profileRoutes } from './profile.routes.ts'
import { router as enrollmentRoutes } from './enrollments.routes.ts'

export const router = Router()

// Mount sub-routes
router.use('/', debugRoutes)
router.use('/', profileRoutes)
router.use('/', enrollmentRoutes)

// Export the main router
export { router as studentsRouter }
