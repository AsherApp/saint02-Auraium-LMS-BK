import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// ===== ATTENDANCE MANAGEMENT =====

// Get attendance records for a session
router.get('/session/:sessionId/records', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params

  // Check if user has access to this session
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, host_email')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  // For students, check if they're enrolled in the course
  if (userRole === 'student') {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('course_id', session.course_id)
      .eq('student_email', userEmail)
      .single()

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }
  }

  // For teachers, check if they're the host or course teacher
  if (userRole === 'teacher' && session.host_email !== userEmail) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_email')
      .eq('id', session.course_id)
      .single()

    if (!course || course.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to view this session' })
    }
  }

  // Get attendance records
  const { data: attendanceRecords, error } = await supabaseAdmin
    .from('live_attendance_records')
    .select(`
      *,
      students(name, email)
    `)
    .eq('session_id', sessionId)
    .order('check_in_time', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  res.json(attendanceRecords || [])
}))

// Get attendance for a live session
router.get('/session/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params

  // Check if user has access to this session
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, host_email')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  // For students, check if they're enrolled in the course
  if (userRole === 'student') {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('course_id', session.course_id)
      .eq('student_email', userEmail)
      .single()

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }
  }

  // For teachers, check if they're the host or course teacher
  if (userRole === 'teacher' && session.host_email !== userEmail) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_email')
      .eq('id', session.course_id)
      .single()

    if (!course || course.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to view this session' })
    }
  }

  // Get attendance records
  const { data: attendanceRecords, error } = await supabaseAdmin
    .from('live_attendance_records')
    .select(`
      *,
      students(name, email)
    `)
    .eq('session_id', sessionId)
    .order('check_in_time', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Get participants
  const { data: participants, error: participantsError } = await supabaseAdmin
    .from('live_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true })

  if (participantsError) return res.status(500).json({ error: participantsError.message })

  // Get attendance report
  const { data: report, error: reportError } = await supabaseAdmin
    .from('live_attendance_reports')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  res.json({
    attendance_records: attendanceRecords || [],
    participants: participants || [],
    report: report || null
  })
}))

// Mark attendance for a student
router.post('/session/:sessionId/mark', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params
  const { student_email, status, notes, participation_score, engagement_score } = req.body

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can mark attendance' })
  }

  // Check if teacher is authorized for this session
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, host_email')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  if (session.host_email !== userEmail) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_email')
      .eq('id', session.course_id)
      .single()

    if (!course || course.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Not authorized for this session' })
    }
  }

  // Check if student is enrolled in the course
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('course_id', session.course_id)
    .eq('student_email', student_email)
    .single()

  if (!enrollment) {
    return res.status(400).json({ error: 'Student not enrolled in this course' })
  }

  // Create or update attendance record
  const { data, error } = await supabaseAdmin
    .from('live_attendance_records')
    .upsert({
      session_id: sessionId,
      student_email: student_email.toLowerCase(),
      status,
      teacher_notes: notes,
      participation_score,
      engagement_score,
      updated_at: new Date()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
}))

// Bulk mark attendance for multiple students
router.post('/session/:sessionId/bulk-mark', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params
  const { attendance_data } = req.body // Array of { student_email, status, notes, participation_score, engagement_score }

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can mark attendance' })
  }

  // Check if teacher is authorized for this session
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, host_email')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  if (session.host_email !== userEmail) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_email')
      .eq('id', session.course_id)
      .single()

    if (!course || course.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Not authorized for this session' })
    }
  }

  // Prepare bulk data
  const bulkData = attendance_data.map((item: any) => ({
    session_id: sessionId,
    student_email: item.student_email.toLowerCase(),
    status: item.status,
    teacher_notes: item.notes,
    participation_score: item.participation_score,
    engagement_score: item.engagement_score,
    updated_at: new Date()
  }))

  const { data, error } = await supabaseAdmin
    .from('live_attendance_records')
    .upsert(bulkData)
    .select()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ updated_records: data })
}))

// Student check-in to live session
router.post('/session/:sessionId/check-in', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can check in' })
  }

  // Check if session exists and is active
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, status, start_time')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  if (session.status !== 'live') {
    return res.status(400).json({ error: 'Session is not currently live' })
  }

  // Check if student is enrolled in the course
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('course_id', session.course_id)
    .eq('student_email', userEmail)
    .single()

  if (!enrollment) {
    return res.status(403).json({ error: 'Not enrolled in this course' })
  }

  // Check if already checked in
  const { data: existingRecord } = await supabaseAdmin
    .from('live_attendance_records')
    .select('*')
    .eq('session_id', sessionId)
    .eq('student_email', userEmail)
    .single()

  if (existingRecord) {
    return res.status(400).json({ error: 'Already checked in to this session' })
  }

  // Calculate if late
  const sessionStart = new Date(session.start_time)
  const now = new Date()
  const lateMinutes = Math.max(0, Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60)))
  
  let status = 'present'
  if (lateMinutes > 30) {
    status = 'absent'
  } else if (lateMinutes > 15) {
    status = 'late'
  }

  // Create attendance record
  const { data, error } = await supabaseAdmin
    .from('live_attendance_records')
    .insert({
      session_id: sessionId,
      student_email: userEmail,
      check_in_time: now,
      status,
      late_minutes: lateMinutes
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Also add to participants
  await supabaseAdmin
    .from('live_participants')
    .upsert({
      session_id: sessionId,
      email: userEmail,
      role: 'student',
      joined_at: now,
      attendance_status: status
    })

  res.json(data)
}))

// Student check-out from live session
router.post('/session/:sessionId/check-out', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params
  const { notes } = req.body

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can check out' })
  }

  // Check if session exists
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, end_at')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  // Find existing attendance record
  const { data: existingRecord } = await supabaseAdmin
    .from('live_attendance_records')
    .select('*')
    .eq('session_id', sessionId)
    .eq('student_email', userEmail)
    .single()

  if (!existingRecord) {
    return res.status(400).json({ error: 'No check-in record found' })
  }

  if (existingRecord.check_out_time) {
    return res.status(400).json({ error: 'Already checked out' })
  }

  const now = new Date()
  const checkInTime = new Date(existingRecord.check_in_time)
  const durationSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000)

  // Calculate attendance percentage if session has end time
  let attendancePercentage = 100
  if (session.end_at) {
    const sessionEnd = new Date(session.end_at)
    const sessionDuration = Math.floor((sessionEnd.getTime() - checkInTime.getTime()) / 1000)
    attendancePercentage = Math.min(100, Math.max(0, (durationSeconds / sessionDuration) * 100))
  }

  // Update attendance record
  const { data, error } = await supabaseAdmin
    .from('live_attendance_records')
    .update({
      check_out_time: now,
      total_duration_seconds: durationSeconds,
      attendance_percentage: attendancePercentage,
      student_notes: notes,
      updated_at: now
    })
    .eq('id', existingRecord.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Update participants record
  await supabaseAdmin
    .from('live_participants')
    .update({
      left_at: now,
      duration_seconds: durationSeconds
    })
    .eq('session_id', sessionId)
    .eq('email', userEmail)

  res.json(data)
}))

// Get attendance settings for a course
router.get('/settings/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { courseId } = req.params

  if (userRole === 'teacher') {
    // Get teacher's settings
    const { data, error } = await supabaseAdmin
      .from('live_attendance_settings')
      .select('*')
      .eq('course_id', courseId)
      .eq('teacher_email', userEmail)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return res.status(500).json({ error: error.message })
    }

    res.json(data || {
      course_id: courseId,
      teacher_email: userEmail,
      late_threshold_minutes: 15,
      absence_threshold_minutes: 30,
      minimum_attendance_percentage: 75.00,
      auto_mark_absent: true,
      require_checkout: false,
      participation_tracking: true,
      attendance_notes_required: false
    })
  } else {
    // Students can view settings for their enrolled courses
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_email', userEmail)
      .single()

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }

    const { data, error } = await supabaseAdmin
      .from('live_attendance_settings')
      .select('late_threshold_minutes, absence_threshold_minutes, minimum_attendance_percentage, require_checkout, participation_tracking')
      .eq('course_id', courseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || {
      late_threshold_minutes: 15,
      absence_threshold_minutes: 30,
      minimum_attendance_percentage: 75.00,
      require_checkout: false,
      participation_tracking: true
    })
  }
}))

// Update attendance settings for a course
router.put('/settings/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { courseId } = req.params
  const updateData = req.body

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can update attendance settings' })
  }

  // Check if teacher owns the course
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('teacher_email')
    .eq('id', courseId)
    .single()

  if (!course || course.teacher_email !== userEmail) {
    return res.status(403).json({ error: 'Not authorized to update settings for this course' })
  }

  const { data, error } = await supabaseAdmin
    .from('live_attendance_settings')
    .upsert({
      course_id: courseId,
      teacher_email: userEmail,
      ...updateData,
      updated_at: new Date()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
}))

// Generate attendance report for a session
router.post('/session/:sessionId/report', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { sessionId } = req.params

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can generate reports' })
  }

  // Check if teacher is authorized for this session
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('course_id, host_email, start_time, end_at')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  if (session.host_email !== userEmail) {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_email')
      .eq('id', session.course_id)
      .single()

    if (!course || course.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Not authorized for this session' })
    }
  }

  // Get all enrolled students
  const { data: enrolledStudents } = await supabaseAdmin
    .from('enrollments')
    .select('student_email')
    .eq('course_id', session.course_id)

  // Get attendance records
  const { data: attendanceRecords } = await supabaseAdmin
    .from('live_attendance_records')
    .select('*')
    .eq('session_id', sessionId)

  // Calculate statistics
  const totalEnrolled = enrolledStudents?.length || 0
  const presentCount = attendanceRecords?.filter(r => r.status === 'present').length || 0
  const lateCount = attendanceRecords?.filter(r => r.status === 'late').length || 0
  const absentCount = attendanceRecords?.filter(r => r.status === 'absent').length || 0
  const excusedCount = attendanceRecords?.filter(r => r.status === 'excused').length || 0

  const averageAttendancePercentage = (attendanceRecords?.length || 0) > 0 
    ? (attendanceRecords || []).reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / (attendanceRecords?.length || 1)
    : 0

  const averageParticipationScore = (attendanceRecords?.length || 0) > 0
    ? (attendanceRecords || []).reduce((sum, r) => sum + (r.participation_score || 0), 0) / (attendanceRecords?.length || 1)
    : 0

  const averageEngagementScore = (attendanceRecords?.length || 0) > 0
    ? (attendanceRecords || []).reduce((sum, r) => sum + (r.engagement_score || 0), 0) / (attendanceRecords?.length || 1)
    : 0

  const sessionDurationMinutes = session.end_at && session.start_time
    ? Math.floor((new Date(session.end_at).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
    : 0

  // Create or update report
  const { data, error } = await supabaseAdmin
    .from('live_attendance_reports')
    .upsert({
      session_id: sessionId,
      total_enrolled_students: totalEnrolled,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      excused_count: excusedCount,
      average_attendance_percentage: averageAttendancePercentage,
      average_participation_score: averageParticipationScore,
      average_engagement_score: averageEngagementScore,
      session_duration_minutes: sessionDurationMinutes,
      generated_at: new Date()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
}))

// Get attendance history for a student
router.get('/student/:studentEmail/history', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = String(req.headers['x-user-role'] || '').toLowerCase()
  const { studentEmail } = req.params
  const { course_id, start_date, end_date } = req.query

  // Students can only view their own history
  if (userRole === 'student' && userEmail !== studentEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Can only view your own attendance history' })
  }

  // Teachers can view any student's history for their courses
  if (userRole === 'teacher') {
    // Verify teacher has access to this student's courses
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('student_email', studentEmail.toLowerCase())

    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map(e => e.course_id)
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id')
        .in('id', courseIds)
        .eq('teacher_email', userEmail)

      if (!courses || courses.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view this student\'s attendance' })
      }
    }
  }

  let query = supabaseAdmin
    .from('live_attendance_records')
    .select(`
      *,
      live_sessions(
        id,
        title,
        start_time,
        end_at,
        courses(title)
      )
    `)
    .eq('student_email', studentEmail.toLowerCase())

  if (course_id) {
    query = query.eq('live_sessions.course_id', course_id)
  }

  if (start_date) {
    query = query.gte('check_in_time', start_date)
  }

  if (end_date) {
    query = query.lte('check_in_time', end_date)
  }

  const { data, error } = await query.order('check_in_time', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  res.json({ items: data || [] })
}))

export default router
