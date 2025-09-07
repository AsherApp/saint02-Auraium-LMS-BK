import express from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateStudentCode } from '../utils/student-code.js'
import { NotificationService } from '../services/notification.service.js'

const router = express.Router()

// Get invite by code
router.get('/:code', asyncHandler(async (req, res) => {
  const { code } = req.params
  
  const { data, error } = await supabaseAdmin
    .from('invites')
    .select(`
      *,
      courses(title, description)
    `)
    .eq('code', code)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Invite not found or expired' })
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invite has expired' })
  }

  // Check if already used
  if (data.used) {
    return res.status(400).json({ error: 'Invite has already been used' })
  }

  // Get teacher information separately
  const { data: teacher } = await supabaseAdmin
    .from('teachers')
    .select('email, first_name, last_name')
    .eq('email', data.created_by)
    .single()

  // Format response with teacher and course information
  const response = {
    ...data,
    teacher_name: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email : 'Unknown Teacher',
    teacher_email: teacher?.email || data.created_by || 'unknown@example.com',
    student_name: data.name || 'Student',
    student_email: data.email || '',
    course_title: data.courses?.title || 'Course',
    course_description: data.courses?.description || ''
  }

  res.json(response)
}))

// List invites for a teacher
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  // SECURITY FIX: Use authenticated user from middleware instead of headers
  const teacher_email = (req as any).user?.email
  if (!teacher_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { course_id } = req.query
  
  let query = supabaseAdmin
    .from('invites')
    .select(`
      *,
      courses(title, description)
    `)
    .eq('created_by', teacher_email)
    .order('created_at', { ascending: false })
  
  if (course_id) {
    query = query.eq('course_id', course_id)
  }
  
  const { data, error } = await query
  
  if (error) return res.status(500).json({ error: error.message })
  
  res.json({
    items: data || [],
    total: data?.length || 0
  })
}))

// Create invite
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  // SECURITY FIX: Use authenticated user from middleware instead of headers
  const teacher_email = (req as any).user?.email
  if (!teacher_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { student_email, student_name, email, name, course_id } = req.body
  
  // Handle both field name variations
  const finalStudentEmail = student_email || email
  const finalStudentName = student_name || name
  
  // Validate required fields
  if (!finalStudentEmail) {
    return res.status(400).json({ error: 'Student email is required' })
  }
  
  if (!finalStudentName) {
    return res.status(400).json({ error: 'Student name is required' })
  }
  
  if (!course_id) {
    return res.status(400).json({ error: 'Course ID is required' })
  }
  
  // Generate unique code
  const code = `${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  
  // Get teacher name
  const { data: teacher } = await supabaseAdmin
    .from('teachers')
    .select('name')
    .eq('email', teacher_email)
    .single()

  const { data, error } = await supabaseAdmin
    .from('invites')
    .insert({
      code,
      email: finalStudentEmail.toLowerCase(),
      name: finalStudentName,
      role: 'student',
      course_id,
      created_by: teacher_email,
      used: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  
  // Send invitation email notification
  try {
    // Get course details for the notification
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('title, description')
      .eq('id', course_id)
      .single()
    
    // Get teacher details
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('first_name, last_name')
      .eq('email', teacher_email)
      .single()
    
    const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Teacher'
    const courseTitle = course?.title || 'Course'
    const courseDescription = course?.description || ''
    const inviteUrl = `${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}/invite/${data.code}`
    
    await NotificationService.sendNotification({
      user_email: finalStudentEmail.toLowerCase(),
      user_type: 'student',
      type: 'course_invitation',
      title: 'You\'ve been invited to join a course!',
      message: `${teacherName} has invited you to join their course "${courseTitle}" on AuraiumLMS.`,
      data: {
        student_name: finalStudentName,
        student_email: finalStudentEmail,
        teacher_name: teacherName,
        teacher_email: teacher_email,
        course_title: courseTitle,
        course_description: courseDescription,
        invite_url: inviteUrl,
        invite_code: data.code,
        expires_at: data.expires_at
      }
    })
  } catch (notificationError) {
    console.error('Error sending invitation notification:', notificationError)
    // Don't fail the invite creation if notification fails
  }
  
  // Return the data with invite URL and code for frontend compatibility
  res.json({
    ...data,
    inviteUrl: `/invite/${data.code}`,
    code: data.code
  })
}))

// Mark invite as used
router.put('/:code/use', asyncHandler(async (req, res) => {
  const { code } = req.params
  
  const { data, error } = await supabaseAdmin
    .from('invites')
    .update({ used: true })
    .eq('code', code)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Complete invite and create student account
router.post('/:code/complete', asyncHandler(async (req, res) => {
  const { code } = req.params
  const { 
    email, 
    name, 
    password,
    // Comprehensive profile data
    first_name,
    last_name,
    date_of_birth,
    phone_number,
    address,
    city,
    state,
    country,
    postal_code,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    academic_level,
    major,
    minor,
    graduation_year,
    gpa,
    academic_interests,
    career_goals,
    bio,
    timezone,
    preferred_language,
    accessibility_needs,
    dietary_restrictions
  } = req.body
  
  // Validate required fields
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name, and password are required' })
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }
  
  // Get the invite
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('code', code)
    .single()

  if (inviteError || !invite) {
    return res.status(404).json({ error: 'Invite not found' })
  }
  
  // Check if already used
  if (invite.used) {
    return res.status(400).json({ error: 'Invite has already been used' })
  }
  
  // Check if email matches
  if (invite.email !== email.toLowerCase()) {
    return res.status(400).json({ error: 'Email does not match invite' })
  }
  
  // Create or update student account with comprehensive profile data
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .upsert({
      email: email.toLowerCase(),
      name: name,
      password_hash: password, // In production, this should be hashed
      status: 'active',
      // Comprehensive profile data
      first_name: first_name || null,
      last_name: last_name || null,
      date_of_birth: date_of_birth || null,
      phone_number: phone_number || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || 'United States',
      postal_code: postal_code || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      emergency_contact_relationship: emergency_contact_relationship || null,
      academic_level: academic_level || null,
      major: major || null,
      minor: minor || null,
      graduation_year: graduation_year || null,
      gpa: gpa || null,
      academic_interests: academic_interests || null,
      career_goals: career_goals || null,
      bio: bio || null,
      timezone: timezone || 'UTC',
      preferred_language: preferred_language || 'English',
      accessibility_needs: accessibility_needs || null,
      dietary_restrictions: dietary_restrictions || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    })
    .select()
    .single()

  if (studentError) return res.status(500).json({ error: studentError.message })
  
  // Mark invite as used
  const { error: updateError } = await supabaseAdmin
    .from('invites')
    .update({ used: true })
    .eq('code', code)

  if (updateError) return res.status(500).json({ error: updateError.message })
  
  // Enroll student in the course if specified
  if (invite.course_id) {
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        course_id: invite.course_id,
        student_email: email.toLowerCase()
      }, {
        onConflict: 'course_id,student_email'
      })

    if (enrollError) {
      console.error('Failed to enroll student:', enrollError)
      // Don't fail the registration if enrollment fails
    }
  }
  
  res.json({
    success: true,
    student: {
      email: student.email,
      name: student.name,
      status: student.status
    }
  })
}))

// Delete invite
router.delete('/:code', requireAuth, asyncHandler(async (req, res) => {
  const { code } = req.params
  const teacher_email = (req as any).user?.email
  if (!teacher_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // First check if the invite exists and belongs to the teacher
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('code', code)
    .eq('created_by', teacher_email)
    .single()
  
  if (inviteError || !invite) {
    return res.status(404).json({ error: 'Invite not found' })
  }
  
  // Check if already used
  if (invite.used) {
    return res.status(400).json({ error: 'Cannot delete used invite' })
  }
  
  // Delete the invite
  const { error: deleteError } = await supabaseAdmin
    .from('invites')
    .delete()
    .eq('code', code)
  
  if (deleteError) return res.status(500).json({ error: deleteError.message })
  
  res.json({ success: true, message: 'Invite deleted successfully' })
}))

export default router

