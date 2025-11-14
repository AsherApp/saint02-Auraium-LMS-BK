import { Router } from 'express'
import { router as courseRoutes } from './courses.routes'
import assignmentRoutes from './assignments/index'
import submissionRoutes from './submissions/index'
import storageRoutes from './storage.routes'
import { router as billingRoutes } from './billing.routes'
import inviteRoutes from './invites.routes'
import { router as studentRoutes } from './students.routes'
import { router as authRoutes } from './auth.routes'
import { router as seedRoutes } from './seed.routes'
import { router as settingsRoutes } from './settings.routes'
import { router as lessonsRoutes } from './lessons.routes'
import { router as modulesRoutes } from './modules.routes'
import { router as uploadRoutes } from './upload.routes'
import { notesRoutes } from './notes.routes'
import { resourceRoutes } from './resource.routes'
import { pollRoutes } from './poll.routes'
import { quizRoutes } from './quiz.routes'
import { attendanceRoutes } from './attendance.routes'
import { participantRoutes } from './participant.routes'
import { recordingRoutes } from './recording.routes'
import studentProgressRoutes from './student-progress.routes'
import { router as teacherRoutes } from './teacher.routes'
import eventsRoutes from './events.routes'
import studentAnalyticsRoutes from './student.routes'
import { router as notificationsRoutes } from './notifications.routes'
import transactionRoutes from './transactions.routes'
import { router as certificateRoutes } from './certificates.routes'
import { router as bulkCoursesRoutes } from './bulk-courses.routes'
import { router as messagesRoutes } from './messages.routes'
import { router as classworkRoutes } from './classwork.routes'
import { router as studentActivityRoutes } from './student-activity.routes'
import { liveClassesRoutes } from './liveClasses.routes'
import { router as discussionsRoutes } from './discussions.routes'
import { router as announcementsRoutes } from './announcements.routes'
import { router as forumRoutes } from './forum.routes'
import { agoraRoutes } from './agora.routes'
import { router as enrollmentsRoutes } from './enrollments.routes'

export const router = Router()

// Core routes
router.use('/courses', courseRoutes)
router.use('/assignments', assignmentRoutes)
router.use('/submissions', submissionRoutes)
router.use('/storage', storageRoutes)
router.use('/billing', billingRoutes)
router.use('/invites', inviteRoutes)
router.use('/students', studentRoutes)
router.use('/enrollments', enrollmentsRoutes)
router.use('/auth', authRoutes)
router.use('/seed', seedRoutes)
router.use('/settings', settingsRoutes)
router.use('/lessons', lessonsRoutes)
router.use('/modules', modulesRoutes)
router.use('/upload', uploadRoutes)

// Live class features
router.use('/notes', notesRoutes)
router.use('/resources', resourceRoutes)
router.use('/polls', pollRoutes)
router.use('/quizzes', quizRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/participants', participantRoutes)
router.use('/recordings', recordingRoutes)
router.use('/live-classes', liveClassesRoutes)

// Student features
router.use('/student-progress', studentProgressRoutes)
router.use('/student-activity', studentActivityRoutes)
router.use('/student', studentAnalyticsRoutes)

// Teacher features
router.use('/teacher', teacherRoutes)
router.use('/classwork', classworkRoutes)

// Communication
router.use('/discussions', discussionsRoutes)
router.use('/announcements', announcementsRoutes)
router.use('/forum', forumRoutes)
router.use('/messages', messagesRoutes)

// Other features
router.use('/events', eventsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/transactions', transactionRoutes)
router.use('/certificates', certificateRoutes)
router.use('/bulk-courses', bulkCoursesRoutes)
router.use('/agora', agoraRoutes)

