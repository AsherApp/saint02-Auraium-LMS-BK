import { Router } from 'express'
import { router as announcementRoutes } from './announcement.routes.js'
import { router as courseRoutes } from './courses.routes.js'
import assignmentRoutes from './assignments'
import submissionRoutes from './submissions'
import storageRoutes from './storage.routes.js'
import { router as billingRoutes } from './billing.routes.js'
import inviteRoutes from './invites.routes.js'
import { router as studentRoutes } from './students.routes.js'
import { router as liveRoutes } from './live.routes.js'
import { router as authRoutes } from './auth.routes.js'
import { router as seedRoutes } from './seed.routes.js'
import { router as settingsRoutes } from './settings.routes.js'
import { router as lessonsRoutes } from './lessons.routes.js'
import { router as modulesRoutes } from './modules.routes.js'
import { router as uploadRoutes } from './upload.routes.js'
import { router as notesRoutes } from './notes.routes.js'
import studentProgressRoutes from './student-progress.routes.js'
import { router as teacherRoutes } from './teacher.routes.js'
import eventsRoutes from './events.routes.js'
import liveAttendanceRoutes from './live-attendance.routes.js'
import quizzesRoutes from './quizzes.routes.js'
import pollsRoutes from './polls.routes.js'
import { router as discussionsRoutes } from './discussions.routes.js'
import { router as forumRoutes } from './forum.routes.js'
import studentAnalyticsRoutes from './student.routes.js'
import { router as notificationsRoutes } from './notifications.routes.js'
import transactionRoutes from './transactions.routes.js'
import { router as certificateRoutes } from './certificates.routes.js'
import { router as bulkCoursesRoutes } from './bulk-courses.routes.js'
import { router as messagesRoutes } from './messages.routes.js'
import recordingsRoutes from './recordings.routes.js'
import { router as classworkRoutes } from './classwork.routes.js'
import { router as studentActivityRoutes } from './student-activity.routes.js'

export const router = Router()

router.use('/announcements', announcementRoutes)
router.use('/courses', courseRoutes)
router.use('/assignments', assignmentRoutes)
router.use('/submissions', submissionRoutes)
router.use('/storage', storageRoutes)
router.use('/billing', billingRoutes)
router.use('/invites', inviteRoutes)
router.use('/students', studentRoutes)
router.use('/live', liveRoutes)
router.use('/auth', authRoutes)
router.use('/seed', seedRoutes)
router.use('/settings', settingsRoutes)
router.use('/lessons', lessonsRoutes)
router.use('/modules', modulesRoutes)
router.use('/upload', uploadRoutes)
router.use('/notes', notesRoutes)
router.use('/student-progress', studentProgressRoutes)
router.use('/teacher', teacherRoutes)
router.use('/events', eventsRoutes)
router.use('/live-attendance', liveAttendanceRoutes)
router.use('/quizzes', quizzesRoutes)
router.use('/polls', pollsRoutes)
router.use('/discussions', discussionsRoutes)
router.use('/forum', forumRoutes)
router.use('/student', studentAnalyticsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/transactions', transactionRoutes)
router.use('/certificates', certificateRoutes)
router.use('/bulk-courses', bulkCoursesRoutes)
router.use('/messages', messagesRoutes)
router.use('/recordings', recordingsRoutes)
router.use('/classwork', classworkRoutes)
router.use('/student-activity', studentActivityRoutes)