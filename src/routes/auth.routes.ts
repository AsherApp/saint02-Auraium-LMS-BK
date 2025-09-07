import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { generateStudentCode } from '../utils/student-code.js'
import { requireAuth } from '../middlewares/auth.js'
import { generateToken } from '../lib/jwt.js'
import { NotificationService } from '../services/notification.service.js'

export const router = Router()

// Get current user info (requires JWT token)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  
  if (!user) {
    return res.status(401).json({ error: 'user_not_found' })
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    student_code: user.student_code,
    subscription_status: user.subscription_status,
    max_students_allowed: user.max_students_allowed,
    // Add profile information
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    user_type: user.user_type
  })
}))

// Teacher sign in
router.post('/teacher/signin', asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Get teacher with password hash from user_profiles view
  const { data: teacher, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, first_name, last_name, user_type')
    .eq('email', email.toLowerCase())
    .eq('user_type', 'teacher')
    .single()
  
  // Get password hash from teachers table
  const { data: teacherAuth, error: authError } = await supabaseAdmin
    .from('teachers')
    .select('password_hash, subscription_status, max_students_allowed')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !teacher || authError || !teacherAuth) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Verify password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.compare(password, teacherAuth.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Generate JWT token
  const token = await generateToken({
    id: teacher.id,
    email: teacher.email,
    role: 'teacher',
    name: `${teacher.first_name} ${teacher.last_name}`,
    subscription_status: teacherAuth.subscription_status,
    max_students_allowed: teacherAuth.max_students_allowed
  })

  res.json({
    user: {
      id: teacher.id,
      email: teacher.email,
      role: 'teacher',
      name: `${teacher.first_name} ${teacher.last_name}`,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      full_name: `${teacher.first_name} ${teacher.last_name}`,
      user_type: teacher.user_type,
      subscription_status: teacherAuth.subscription_status,
      max_students_allowed: teacherAuth.max_students_allowed
    },
    token
  })
}))

// Student sign in with code
router.post('/student/signin-code', asyncHandler(async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Check if the code exists and is valid
  const { data: loginCode, error: codeError } = await supabaseAdmin
    .from('student_login_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (codeError || !loginCode) {
    return res.status(401).json({ error: 'invalid_code' })
  }

  // Get student info from user_profiles view
  const { data: student, error: studentError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, first_name, last_name, user_type')
    .eq('email', email.toLowerCase())
    .eq('user_type', 'student')
    .single()
  
  // Get student status from students table
  const { data: studentStatus, error: statusError } = await supabaseAdmin
    .from('students')
    .select('status')
    .eq('email', email.toLowerCase())
    .single()

  if (studentError || !student || statusError || !studentStatus) {
    return res.status(401).json({ error: 'student_not_found' })
  }

  if (studentStatus.status !== 'active') {
    return res.status(403).json({ error: 'account_suspended' })
  }

  // Mark code as used
  await supabaseAdmin
    .from('student_login_codes')
    .update({ used: true })
    .eq('id', loginCode.id)

  // Generate JWT token
  const token = await generateToken({
    id: student.id,
    email: student.email,
    role: 'student',
    name: `${student.first_name} ${student.last_name}`
  })

  res.json({
    user: {
      id: student.id,
      email: student.email,
      role: 'student',
      name: `${student.first_name} ${student.last_name}`,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`,
      user_type: student.user_type
    },
    token
  })
}))

// Get all students for a teacher (for invite modal)
router.get('/teacher/students', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'teacher_access_required' })
  }

  // Get all students that the teacher can see from user_profiles view
  const { data: students, error } = await supabaseAdmin
    .from('user_profiles')
    .select('email, first_name, last_name, user_type, created_at')
    .eq('user_type', 'student')
    .order('first_name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Transform students data to include name field
  const transformedStudents = (students || []).map(student => ({
    email: student.email,
    name: `${student.first_name} ${student.last_name}`,
    first_name: student.first_name,
    last_name: student.last_name,
    status: 'active', // All students from user_profiles are active
    created_at: student.created_at
  }))
  
  res.json({ items: transformedStudents })
}))

// Student sign in with student code and password
router.post('/student/signin', asyncHandler(async (req, res) => {
  const { student_code, password } = req.body
  if (!student_code || !password) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Get student with password hash from user_profiles view
  const { data: student, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, first_name, last_name, user_type')
    .eq('email', (await supabaseAdmin
      .from('students')
      .select('email')
      .eq('student_code', student_code.toUpperCase())
      .single()
    ).data?.email)
    .eq('user_type', 'student')
    .single()
  
  // Get student auth data from students table
  const { data: studentAuth, error: authError } = await supabaseAdmin
    .from('students')
    .select('student_code, password_hash, status')
    .eq('student_code', student_code.toUpperCase())
    .single()

  if (error || !student || authError || !studentAuth) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  if (studentAuth.status !== 'active') {
    return res.status(403).json({ error: 'account_suspended' })
  }

  // Check if student has a password set
  if (!studentAuth.password_hash) {
    return res.status(401).json({ error: 'password_not_set' })
  }

  // Verify password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.compare(password, studentAuth.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Generate JWT token
  const token = await generateToken({
    id: student.id,
    email: student.email,
    role: 'student',
    name: `${student.first_name} ${student.last_name}`,
    student_code: studentAuth.student_code
  })

  res.json({
    user: {
      id: student.id,
      email: student.email,
      role: 'student',
      name: `${student.first_name} ${student.last_name}`,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`,
      user_type: student.user_type,
      student_code: studentAuth.student_code
    },
    token
  })
}))

// Create student login code
router.post('/student/login-code', asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'missing_email' })
  }

  // Check if student exists
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('email')
    .eq('email', email.toLowerCase())
    .single()

  if (studentError || !student) {
    return res.status(404).json({ error: 'student_not_found' })
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create login code
  const { data: loginCode, error: codeError } = await supabaseAdmin
    .from('student_login_codes')
    .insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (codeError) {
    return res.status(500).json({ error: codeError.message })
  }

  res.json({ code, expires_at: expiresAt.toISOString() })
}))

// Student registration with invite
router.post('/student/register', asyncHandler(async (req, res) => {
  const { 
    invite_code, 
    first_name, 
    last_name, 
    email, 
    password,
    // Comprehensive profile data
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
  
  if (!invite_code || !first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All required fields are required' })
  }

  // Validate invite
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('code', invite_code)
    .single()

  if (inviteError || !invite) {
    return res.status(400).json({ error: 'Invalid invite code' })
  }

  if (invite.used) {
    return res.status(400).json({ error: 'Invite has already been used' })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invite has expired' })
  }

  // Check if student already exists
  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingStudent) {
    return res.status(400).json({ error: 'Student with this email already exists' })
  }

  // Generate student code
  const studentCode = generateStudentCode(first_name, last_name)
  
  // Hash password
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.hash(password, 10)

  // Create student with comprehensive profile data
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      email: email.toLowerCase(),
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      student_code: studentCode,
      password_hash: passwordHash,
      status: 'active',
      // Comprehensive profile data
      date_of_birth: date_of_birth || null,
      phone_number: phone_number || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
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
      timezone: timezone || null,
      preferred_language: preferred_language || null,
      accessibility_needs: accessibility_needs || null,
      dietary_restrictions: dietary_restrictions || null,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (studentError) {
    return res.status(500).json({ error: studentError.message })
  }

  // Mark invite as used
  await supabaseAdmin
    .from('invites')
    .update({ used: true })
    .eq('code', invite_code)

  // Create enrollment if course_id is provided
  if (invite.course_id) {
    await supabaseAdmin
      .from('enrollments')
      .insert({
        course_id: invite.course_id,
        student_email: email.toLowerCase(),
        enrolled_at: new Date().toISOString()
      })
  }

  // Send signup notification
  try {
    await NotificationService.sendNotification({
      user_email: email.toLowerCase(),
      user_type: 'student',
      type: 'signup',
      title: 'Welcome to AuraiumLMS!',
      message: 'Your student account has been successfully created. You can now access your courses and start learning.',
      data: {
        student_code: studentCode,
        first_name,
        last_name,
        invite_code: invite_code,
        course_id: invite.course_id,
        registration_date: new Date().toISOString()
      }
    })
  } catch (notificationError) {
    console.error('Error sending signup notification:', notificationError)
    // Don't fail the registration if notification fails
  }

  // Generate JWT token for immediate login
  const token = await generateToken({
    id: student.id,
    email: student.email,
    role: 'student',
    name: student.name,
    student_code: student.student_code
  })

  res.json({ 
    message: 'Student registered successfully',
    student_code: studentCode,
    token,
    user: {
      id: student.id,
      email: student.email,
      role: 'student',
      name: student.name,
      student_code: student.student_code
    },
    student: {
      email: student.email,
      name: student.name,
      student_code: student.student_code
    }
  })
}))

// Teacher registration
router.post('/teacher/register', asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password } = req.body
  
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  // Check if teacher already exists
  const { data: existingTeacher } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingTeacher) {
    return res.status(400).json({ error: 'Teacher with this email already exists' })
  }

  // Hash password
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.hash(password, 10)

  // Create teacher with complete profile
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .insert({
      email: email.toLowerCase(),
      first_name,
      last_name,
      password_hash: passwordHash,
      subscription_status: 'free',
      max_students_allowed: 50,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (teacherError) {
    return res.status(500).json({ error: teacherError.message })
  }

  // Send signup notification
  try {
    await NotificationService.sendNotification({
      user_email: email.toLowerCase(),
      user_type: 'teacher',
      type: 'teacher_signup',
      title: 'Welcome to AuraiumLMS!',
      message: 'Your teacher account has been successfully created. You can now start creating courses, managing students, and tracking their progress.',
      data: {
        first_name,
        last_name,
        registration_date: new Date().toISOString(),
        subscription_status: teacher.subscription_status
      }
    })
  } catch (notificationError) {
    console.error('Error sending teacher signup notification:', notificationError)
    // Don't fail the registration if notification fails
  }

  res.json({ 
    message: 'Teacher registered successfully',
    teacher: {
      email: teacher.email,
      name: `${first_name} ${last_name}`,
      subscription_status: teacher.subscription_status
    }
  })
}))

// Change student password
router.post('/student/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body
  
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Get student with current password
  const { data: student, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (fetchError || !student) {
    return res.status(404).json({ error: 'Student not found' })
  }

  // Verify current password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.default.compare(currentPassword, student.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  // Hash new password
  const newPasswordHash = await bcrypt.default.hash(newPassword, 10)

  // Update password
  const { error: updateError } = await supabaseAdmin
    .from('students')
    .update({ password_hash: newPasswordHash })
    .eq('email', email.toLowerCase())

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  // Send password change notification
  try {
    await NotificationService.sendNotification({
      user_email: email.toLowerCase(),
      user_type: 'student',
      type: 'password_changed',
      title: 'Password Successfully Changed',
      message: 'Your password has been successfully changed for your AuraiumLMS account.',
      data: {
        change_date: new Date().toISOString(),
        user_name: `${student.first_name} ${student.last_name}`
      }
    })
  } catch (notificationError) {
    console.error('Error sending password change notification:', notificationError)
    // Don't fail the password change if notification fails
  }

  res.json({ message: 'Password changed successfully' })
}))

// Password reset request
router.post('/password-reset-request', asyncHandler(async (req, res) => {
  const { email } = req.body
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Check if user exists in user_profiles
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email, user_type')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userProfile) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the email exists, a password reset link has been sent.' })
    }

    // Generate reset token (in a real app, you'd use a proper token system)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store reset token (you'd create a password_reset_tokens table)
    // For now, we'll just send the notification
    await NotificationService.sendNotification({
      user_email: email.toLowerCase(),
      user_type: userProfile.user_type,
      type: 'password_reset',
      title: 'Password Reset Request',
      message: 'You have requested to reset your password. Please use the link below to reset your password.',
      data: {
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        user_name: `${userProfile.first_name} ${userProfile.last_name}`,
        reset_url: `${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}/reset-password?token=${resetToken}`
      }
    })

    res.json({ message: 'If the email exists, a password reset link has been sent.' })
  } catch (error: any) {
    console.error('Error in password reset request:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Password reset confirmation
router.post('/password-reset-confirm', asyncHandler(async (req, res) => {
  const { token, newPassword, email } = req.body
  
  if (!token || !newPassword || !email) {
    return res.status(400).json({ error: 'Token, email, and new password are required' })
  }

  try {
    // In a real app, you'd validate the token from the database
    // For now, we'll assume the token is valid and update the password
    
    // Hash the new password
    const bcrypt = await import('bcrypt')
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password in both teachers and students tables
    // First, find which table the user is in
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('email, user_type')
      .eq('email', email.toLowerCase())
      .single()

    if (!userProfile) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    // Update password based on user type
    if (userProfile.user_type === 'teacher') {
      await supabaseAdmin
        .from('teachers')
        .update({ password_hash: passwordHash })
        .eq('email', userProfile.email)
    } else if (userProfile.user_type === 'student') {
      await supabaseAdmin
        .from('students')
        .update({ password_hash: passwordHash })
        .eq('email', userProfile.email)
    }

    // Send password reset success notification
    await NotificationService.sendNotification({
      user_email: userProfile.email,
      user_type: userProfile.user_type,
      type: 'password_reset_success',
      title: 'Password Successfully Reset',
      message: 'Your password has been successfully reset. You can now login with your new password.',
      data: {
        reset_at: new Date().toISOString(),
        login_url: `${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}/login`
      }
    })

    res.json({ message: 'Password has been successfully reset.' })
  } catch (error: any) {
    console.error('Error in password reset confirmation:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

export default router