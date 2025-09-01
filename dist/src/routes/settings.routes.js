import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { supabaseAdmin } from '../lib/supabase.js';
export const router = Router();
// Get user settings by ID
router.get('/:userId', requireAuth, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // Check if user is requesting their own settings
    const user = req.user;
    if (user?.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Check if user is a teacher
    const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('id', userId)
        .single();
    if (teacher) {
        // Get teacher settings
        const { data, error } = await supabaseAdmin
            .from('teacher_settings')
            .select('*')
            .eq('teacher_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            return res.status(500).json({ error: error.message });
        }
        // Return default settings if none exist
        if (!data) {
            return res.json({
                theme: 'dark',
                notifications: {
                    email: true,
                    push: true,
                    assignments: true,
                    announcements: true,
                    live_class: true
                },
                privacy: {
                    profile_visible: true,
                    show_email: false,
                    show_bio: true
                },
                preferences: {
                    language: 'en',
                    timezone: 'UTC',
                    date_format: 'MM/DD/YYYY'
                }
            });
        }
        res.json({
            theme: data.theme,
            notifications: data.notifications,
            privacy: data.privacy,
            preferences: data.preferences
        });
    }
    else {
        // Check if user is a student
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('id', userId)
            .single();
        if (student) {
            // Get student settings
            const { data, error } = await supabaseAdmin
                .from('student_settings')
                .select('*')
                .eq('student_id', userId)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                return res.status(500).json({ error: error.message });
            }
            // Return default settings if none exist
            if (!data) {
                return res.json({
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: true,
                        assignments: true,
                        announcements: true,
                        live_class: true
                    },
                    privacy: {
                        profile_visible: true,
                        show_email: false,
                        show_bio: true
                    },
                    preferences: {
                        language: 'en',
                        timezone: 'UTC',
                        date_format: 'MM/DD/YYYY'
                    }
                });
            }
            res.json({
                theme: data.theme,
                notifications: data.notifications,
                privacy: data.privacy,
                preferences: data.preferences
            });
        }
        else {
            return res.status(404).json({ error: 'user_not_found' });
        }
    }
}));
// Get user settings by email (for backward compatibility)
router.get('/email/:userEmail', requireAuth, asyncHandler(async (req, res) => {
    const { userEmail } = req.params;
    // Check if user is requesting their own settings
    const user = req.user;
    if (user?.email?.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Check if user is a teacher
    const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('email', userEmail.toLowerCase())
        .single();
    if (teacher) {
        // Get teacher settings
        const { data, error } = await supabaseAdmin
            .from('teacher_settings')
            .select('*')
            .eq('teacher_id', teacher.id)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            return res.status(500).json({ error: error.message });
        }
        // Return default settings if none exist
        if (!data) {
            return res.json({
                theme: 'dark',
                notifications: {
                    email: true,
                    push: true,
                    assignments: true,
                    announcements: true,
                    live_class: true
                },
                privacy: {
                    profile_visible: true,
                    show_email: false,
                    show_bio: true
                },
                preferences: {
                    language: 'en',
                    timezone: 'UTC',
                    date_format: 'MM/DD/YYYY'
                }
            });
        }
        res.json({
            theme: data.theme,
            notifications: data.notifications,
            privacy: data.privacy,
            preferences: data.preferences
        });
    }
    else {
        // Check if user is a student
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('email', userEmail.toLowerCase())
            .single();
        if (student) {
            // Get student settings
            const { data, error } = await supabaseAdmin
                .from('student_settings')
                .select('*')
                .eq('student_id', student.id)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                return res.status(500).json({ error: error.message });
            }
            // Return default settings if none exist
            if (!data) {
                return res.json({
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: true,
                        assignments: true,
                        announcements: true,
                        live_class: true
                    },
                    privacy: {
                        profile_visible: true,
                        show_email: false,
                        show_bio: true
                    },
                    preferences: {
                        language: 'en',
                        timezone: 'UTC',
                        date_format: 'MM/DD/YYYY'
                    }
                });
            }
            res.json({
                theme: data.theme,
                notifications: data.notifications,
                privacy: data.privacy,
                preferences: data.preferences
            });
        }
        else {
            return res.status(404).json({ error: 'user_not_found' });
        }
    }
}));
// Update user settings by ID
router.put('/:userId', requireAuth, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { theme, notifications, privacy, preferences } = req.body;
    // Check if user is updating their own settings
    const user = req.user;
    if (user?.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Check if user is a teacher
    const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('id', userId)
        .single();
    if (teacher) {
        // Upsert teacher settings
        const { data, error } = await supabaseAdmin
            .from('teacher_settings')
            .upsert({
            teacher_id: userId,
            theme,
            notifications,
            privacy,
            preferences
        })
            .select()
            .single();
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json({
            theme: data.theme,
            notifications: data.notifications,
            privacy: data.privacy,
            preferences: data.preferences
        });
    }
    else {
        // Check if user is a student
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('id', userId)
            .single();
        if (student) {
            // Upsert student settings
            const { data, error } = await supabaseAdmin
                .from('student_settings')
                .upsert({
                student_id: userId,
                theme,
                notifications,
                privacy,
                preferences
            })
                .select()
                .single();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.json({
                theme: data.theme,
                notifications: data.notifications,
                privacy: data.privacy,
                preferences: data.preferences
            });
        }
        else {
            return res.status(404).json({ error: 'user_not_found' });
        }
    }
}));
