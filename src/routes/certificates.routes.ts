import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const router = Router()

// Generate certificate PDF
router.post('/generate', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can generate certificates
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  const { course_id, student_email, student_name, completion_date } = req.body
  
  if (!course_id || !student_email || !student_name) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  // Verify the student has access to this course
  if (student_email !== userEmail) {
    return res.status(403).json({ error: 'Access denied - Can only generate certificates for your own courses' })
  }
  
  try {
    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('title, description, teacher_email')
      .eq('id', course_id)
      .single()
    
    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Get enrollment to verify completion
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('progress_percentage, enrolled_at')
      .eq('course_id', course_id)
      .eq('student_email', student_email)
      .single()
    
    if (enrollmentError || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }
    
    // Check if course is completed (100% progress)
    if (enrollment.progress_percentage < 100) {
      return res.status(400).json({ error: 'Course not completed yet' })
    }
    
    // Generate certificate PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // 8.5 x 11 inches
    
    // Set up fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Certificate background (simple design)
    page.drawRectangle({
      x: 50,
      y: 50,
      width: 512,
      height: 692,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 3,
    })
    
    // Title
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: 150,
      y: 650,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
    
    // Subtitle
    page.drawText('This is to certify that', {
      x: 200,
      y: 600,
      size: 16,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    // Student name
    page.drawText(student_name, {
      x: 200,
      y: 550,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
    
    // Course completion text
    page.drawText('has successfully completed the course', {
      x: 180,
      y: 500,
      size: 16,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    // Course title
    page.drawText(`"${course.title}"`, {
      x: 200,
      y: 450,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
    
    // Completion date
    const completionDate = completion_date ? new Date(completion_date).toLocaleDateString() : new Date().toLocaleDateString()
    page.drawText(`Completed on: ${completionDate}`, {
      x: 200,
      y: 400,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    // Signature line
    page.drawText('AuraiumLMS', {
      x: 250,
      y: 200,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
    
    page.drawLine({
      start: { x: 200, y: 180 },
      end: { x: 400, y: 180 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    })
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    
    // Convert to base64 for response
    const base64Pdf = Buffer.from(pdfBytes).toString('base64')
    
    // Store certificate in database (optional)
    const { error: certError } = await supabaseAdmin
      .from('certificates')
      .upsert({
        student_email: student_email,
        course_id: course_id,
        student_name: student_name,
        course_title: course.title,
        completion_date: completion_date || new Date().toISOString(),
        certificate_data: base64Pdf,
        created_at: new Date().toISOString()
      })
    
    if (certError) {
      console.error('Error storing certificate:', certError)
      // Don't fail the request if storage fails
    }
    
    res.json({
      success: true,
      certificate_url: `data:application/pdf;base64,${base64Pdf}`,
      course_title: course.title,
      student_name: student_name,
      completion_date: completion_date
    })
    
  } catch (error) {
    console.error('Error generating certificate:', error)
    res.status(500).json({ error: 'Failed to generate certificate' })
  }
}))

// Get certificate by course ID
router.get('/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access certificates
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  try {
    // Get certificate from database
    const { data: certificate, error } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_email', userEmail)
      .single()
    
    if (error || !certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }
    
    res.json({
      success: true,
      certificate_url: `data:application/pdf;base64,${certificate.certificate_data}`,
      course_title: certificate.course_title,
      student_name: certificate.student_name,
      completion_date: certificate.completion_date
    })
    
  } catch (error) {
    console.error('Error fetching certificate:', error)
    res.status(500).json({ error: 'Failed to fetch certificate' })
  }
}))

// List all certificates for a student
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their certificates
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  try {
    // Get all certificates for the student
    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('student_email', userEmail)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching certificates:', error)
      return res.status(500).json({ error: error.message })
    }
    
    // Return certificate metadata (without the actual PDF data)
    const certificateList = (certificates || []).map((cert: any) => ({
      id: cert.id,
      course_id: cert.course_id,
      course_title: cert.course_title,
      student_name: cert.student_name,
      completion_date: cert.completion_date,
      created_at: cert.created_at,
      certificate_url: `/api/certificates/${cert.course_id}`
    }))
    
    res.json({ items: certificateList })
    
  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
}))

export default router