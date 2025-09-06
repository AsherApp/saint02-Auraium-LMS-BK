import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CertificateService } from '../services/certificate.service.js';
import { supabaseAdmin } from '../lib/supabase.js';
const router = Router();
/**
 * Generate certificate for a completed course
 */
router.post('/generate', requireAuth, asyncHandler(async (req, res) => {
    const { courseId, studentEmail } = req.body || {};
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!courseId || !studentEmail) {
        return res.status(400).json({ error: 'Missing courseId or studentEmail' });
    }
    try {
        // Check if course is completed
        const isCompleted = await CertificateService.isCourseCompleted(studentEmail, courseId);
        if (!isCompleted) {
            return res.status(400).json({ error: 'Course not completed yet' });
        }
        // Get student and course information
        const [studentResult, courseResult] = await Promise.all([
            supabaseAdmin
                .from('students')
                .select('name, email')
                .eq('email', studentEmail)
                .single(),
            supabaseAdmin
                .from('courses')
                .select('title, teacher_email')
                .eq('id', courseId)
                .single()
        ]);
        if (studentResult.error || !studentResult.data) {
            return res.status(404).json({ error: 'Student not found' });
        }
        if (courseResult.error || !courseResult.data) {
            return res.status(404).json({ error: 'Course not found' });
        }
        // Check if user has permission to generate certificate
        if (userRole === 'student' && userEmail !== studentEmail) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (userRole === 'teacher' && userEmail !== courseResult.data.teacher_email) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Check if certificate already exists
        const existingCertificate = await CertificateService.getCertificate(studentEmail, courseId);
        if (existingCertificate) {
            return res.json({
                success: true,
                certificateUrl: existingCertificate,
                message: 'Certificate already exists'
            });
        }
        // Generate new certificate
        const certificateData = {
            studentName: studentResult.data.name || studentResult.data.email,
            courseTitle: courseResult.data.title,
            completionDate: new Date().toLocaleDateString(),
            studentEmail: studentEmail,
            courseId: courseId
        };
        const certificateUrl = await CertificateService.generateCertificate(certificateData);
        res.json({
            success: true,
            certificateUrl: certificateUrl,
            message: 'Certificate generated successfully'
        });
    }
    catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
}));
/**
 * Get certificate for a student and course
 */
router.get('/:courseId/:studentEmail', requireAuth, asyncHandler(async (req, res) => {
    const { courseId, studentEmail } = req.params;
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    try {
        // Check permissions
        if (userRole === 'student' && userEmail !== studentEmail) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (userRole === 'teacher') {
            // Check if teacher owns the course
            const { data: course, error: courseError } = await supabaseAdmin
                .from('courses')
                .select('teacher_email')
                .eq('id', courseId)
                .single();
            if (courseError || !course || course.teacher_email !== userEmail) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        const certificateUrl = await CertificateService.getCertificate(studentEmail, courseId);
        if (!certificateUrl) {
            return res.status(404).json({ error: 'Certificate not found' });
        }
        res.json({
            success: true,
            certificateUrl: certificateUrl
        });
    }
    catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({ error: 'Failed to get certificate' });
    }
}));
/**
 * Mark course as completed and generate certificate
 */
router.post('/complete', requireAuth, asyncHandler(async (req, res) => {
    const { courseId } = req.body || {};
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!courseId) {
        return res.status(400).json({ error: 'Missing courseId' });
    }
    if (userRole !== 'student') {
        return res.status(403).json({ error: 'Only students can complete courses' });
    }
    try {
        // Mark course as completed
        await CertificateService.markCourseCompleted(userEmail, courseId);
        // Generate certificate
        const certificateData = {
            studentName: userEmail, // Will be updated with actual name
            courseTitle: '', // Will be fetched
            completionDate: new Date().toLocaleDateString(),
            studentEmail: userEmail,
            courseId: courseId
        };
        // Get student and course info for certificate
        const [studentResult, courseResult] = await Promise.all([
            supabaseAdmin
                .from('students')
                .select('name')
                .eq('email', userEmail)
                .single(),
            supabaseAdmin
                .from('courses')
                .select('title')
                .eq('id', courseId)
                .single()
        ]);
        if (studentResult.data) {
            certificateData.studentName = studentResult.data.name || userEmail;
        }
        if (courseResult.data) {
            certificateData.courseTitle = courseResult.data.title;
        }
        const certificateUrl = await CertificateService.generateCertificate(certificateData);
        res.json({
            success: true,
            certificateUrl: certificateUrl,
            message: 'Course completed and certificate generated'
        });
    }
    catch (error) {
        console.error('Course completion error:', error);
        res.status(500).json({ error: 'Failed to complete course' });
    }
}));
export { router as certificateRoutes };
