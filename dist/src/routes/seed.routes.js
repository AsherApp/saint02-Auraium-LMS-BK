import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { supabaseAdmin } from '../lib/supabase.js';
export const router = Router();
// Add test data to database
router.post('/seed', asyncHandler(async (req, res) => {
    try {
        // Add a test teacher
        const { data: teacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .upsert({
            email: 'teacher@school.edu',
            subscription_status: 'free',
            max_students_allowed: 10
        }, { onConflict: 'email' })
            .select()
            .single();
        if (teacherError)
            throw teacherError;
        // Add test students
        const testStudents = [
            { email: 'student1@school.edu', name: 'Alice Johnson', status: 'active' },
            { email: 'student2@school.edu', name: 'Bob Smith', status: 'active' },
            { email: 'student3@school.edu', name: 'Carol Davis', status: 'active' }
        ];
        const { data: students, error: studentsError } = await supabaseAdmin
            .from('students')
            .upsert(testStudents, { onConflict: 'email' })
            .select();
        if (studentsError)
            throw studentsError;
        // Add a test course
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .upsert({
            teacher_email: 'teacher@school.edu',
            title: 'Introduction to Programming',
            description: 'Learn the basics of programming with Python',
            status: 'published',
            visibility: 'public',
            enrollment_policy: 'invite_only'
        })
            .select()
            .single();
        if (courseError)
            throw courseError;
        // Add test enrollments
        const enrollments = [
            { course_id: course.id, student_email: 'student1@school.edu' },
            { course_id: course.id, student_email: 'student2@school.edu' }
        ];
        const { error: enrollmentsError } = await supabaseAdmin
            .from('enrollments')
            .upsert(enrollments, { onConflict: 'course_id,student_email' });
        if (enrollmentsError)
            throw enrollmentsError;
        // Add test student login codes
        const loginCodes = [
            {
                email: 'student1@school.edu',
                code: '123456',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                used: false
            },
            {
                email: 'student2@school.edu',
                code: '234567',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                used: false
            },
            {
                email: 'student3@school.edu',
                code: '345678',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                used: false
            }
        ];
        const { error: codesError } = await supabaseAdmin
            .from('student_login_codes')
            .upsert(loginCodes, { onConflict: 'email,code' });
        if (codesError)
            throw codesError;
        res.json({
            message: 'Test data seeded successfully',
            teacher: teacher.email,
            students: students.map(s => s.email),
            course: course.title,
            loginCodes: loginCodes.map(lc => ({ email: lc.email, code: lc.code }))
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Get test data info
router.get('/info', asyncHandler(async (req, res) => {
    const { data: teachers } = await supabaseAdmin.from('teachers').select('email');
    const { data: students } = await supabaseAdmin.from('students').select('email, name');
    const { data: courses } = await supabaseAdmin.from('courses').select('title, teacher_email');
    const { data: enrollments } = await supabaseAdmin.from('enrollments').select('course_id, student_email');
    const { data: loginCodes } = await supabaseAdmin.from('student_login_codes').select('email, code, used');
    res.json({
        teachers: teachers || [],
        students: students || [],
        courses: courses || [],
        enrollments: enrollments || [],
        loginCodes: loginCodes || []
    });
}));
