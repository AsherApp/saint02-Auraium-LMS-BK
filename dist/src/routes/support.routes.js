import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
// Support staff authentication
const requireSupportStaff = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'authentication_required' });
    }
    // Check if user is support staff by checking the support_staff table
    const { data: supportStaff } = await supabaseAdmin
        .from('support_staff')
        .select('*')
        .eq('email', req.user.email)
        .eq('is_active', true)
        .single();
    if (!supportStaff) {
        return res.status(403).json({ error: 'support_access_required' });
    }
    req.user.supportRole = supportStaff.role;
    req.user.supportId = supportStaff.id;
    next();
});
// Validation schemas
const createTicketSchema = z.object({
    category_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    subject: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    metadata: z.record(z.any()).optional()
});
const updateTicketSchema = z.object({
    category_id: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']).optional(),
    subject: z.string().min(1).max(200).optional(),
    assigned_to: z.string().uuid().optional().nullable(),
    tags: z.array(z.string()).optional()
});
const createMessageSchema = z.object({
    message: z.string().min(1).max(5000),
    is_internal: z.boolean().default(false),
    attachments: z.array(z.string()).default([])
});
const createContentSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    excerpt: z.string().max(500).optional(),
    category: z.string().min(1),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    type: z.enum(['article', 'video', 'download']).default('article'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    is_featured: z.boolean().default(false),
    estimated_time: z.number().min(1).default(5)
});
// ===== TICKET MANAGEMENT =====
// Create a support ticket
router.post('/tickets', requireAuth, asyncHandler(async (req, res) => {
    const validatedData = createTicketSchema.parse(req.body);
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .insert({
        user_email: req.user.email,
        user_role: req.user.role,
        ...validatedData
    })
        .select('*')
        .single();
    if (error) {
        console.error('Create ticket error:', error);
        return res.status(500).json({ error: 'ticket_creation_failed' });
    }
    res.status(201).json(ticket);
}));
// Get user's tickets
router.get('/tickets', requireAuth, asyncHandler(async (req, res) => {
    const { status, page = '1', limit = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = supabaseAdmin
        .from('support_tickets')
        .select(`
      *,
      category:support_categories(name, color),
      assigned_staff:support_staff(name, email),
      message_count:support_messages(count)
    `)
        .eq('user_email', req.user.email)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);
    if (status) {
        query = query.eq('status', status);
    }
    const { data: tickets, error } = await query;
    if (error) {
        console.error('Get tickets error:', error);
        return res.status(500).json({ error: 'tickets_fetch_failed' });
    }
    res.json({ tickets });
}));
// Get specific ticket details
router.get('/tickets/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .select(`
      *,
      category:support_categories(name, color),
      assigned_staff:support_staff(name, email),
      messages:support_messages(
        *,
        sender_name:support_staff(name)
      )
    `)
        .eq('id', id)
        .eq('user_email', req.user.email)
        .single();
    if (error || !ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
    }
    res.json(ticket);
}));
// Update ticket (user can only update their own tickets)
router.put('/tickets/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = updateTicketSchema.parse(req.body);
    // Users can only update priority and add tags, not status or assignment
    const allowedFields = ['priority', 'tags'];
    const updateData = Object.fromEntries(Object.entries(validatedData).filter(([key]) => allowedFields.includes(key)));
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .eq('user_email', req.user.email)
        .select('*')
        .single();
    if (error || !ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
    }
    res.json(ticket);
}));
// Add message to ticket
router.post('/tickets/:id/messages', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = createMessageSchema.parse(req.body);
    // Verify user owns the ticket
    const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('id')
        .eq('id', id)
        .eq('user_email', req.user.email)
        .single();
    if (!ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
    }
    const { data: message, error } = await supabaseAdmin
        .from('support_messages')
        .insert({
        ticket_id: id,
        sender_email: req.user.email,
        sender_role: req.user.role,
        ...validatedData
    })
        .select('*')
        .single();
    if (error) {
        console.error('Create message error:', error);
        return res.status(500).json({ error: 'message_creation_failed' });
    }
    // Update ticket's updated_at timestamp
    await supabaseAdmin
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
    res.status(201).json(message);
}));
// ===== ADMIN/SUPPORT STAFF ENDPOINTS =====
// Support staff login
router.post('/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email_password_required' });
    }
    const { data: staff, error } = await supabaseAdmin
        .from('support_staff')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();
    if (error || !staff) {
        return res.status(401).json({ error: 'invalid_credentials' });
    }
    const validPassword = await bcrypt.compare(password, staff.password_hash);
    if (!validPassword) {
        return res.status(401).json({ error: 'invalid_credentials' });
    }
    // Generate JWT token (reuse existing JWT logic)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({
        email: staff.email,
        role: staff.role,
        name: staff.name,
        supportId: staff.id
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({
        token,
        user: {
            email: staff.email,
            name: staff.name,
            role: staff.role,
            supportId: staff.id,
            department: staff.department
        }
    });
}));
// Get all tickets (admin/support staff only)
router.get('/admin/tickets', requireSupportStaff, asyncHandler(async (req, res) => {
    const { status, assigned_to, category, page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = supabaseAdmin
        .from('support_tickets')
        .select(`
      *,
      category:support_categories(name, color),
      assigned_staff:support_staff(name, email),
      message_count:support_messages(count),
      user_details:teachers(name, subscription_status)
    `)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);
    if (status)
        query = query.eq('status', status);
    if (assigned_to)
        query = query.eq('assigned_to', assigned_to);
    if (category)
        query = query.eq('category_id', category);
    const { data: tickets, error } = await query;
    if (error) {
        console.error('Get admin tickets error:', error);
        return res.status(500).json({ error: 'tickets_fetch_failed' });
    }
    res.json({ tickets });
}));
// Assign ticket to support staff
router.put('/admin/tickets/:id/assign', requireSupportStaff, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assigned_to, status } = req.body;
    const updateData = {};
    if (assigned_to !== undefined)
        updateData.assigned_to = assigned_to;
    if (status)
        updateData.status = status;
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
    if (error || !ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
    }
    // Log the assignment action
    await supabaseAdmin
        .from('support_audit_log')
        .insert({
        staff_id: req.user.supportId,
        action: 'ticket_assigned',
        resource_type: 'ticket',
        resource_id: id,
        details: { assigned_to, previous_status: ticket.status, new_status: status }
    });
    res.json(ticket);
}));
// Update ticket status (admin/support staff only)
router.put('/admin/tickets/:id', requireSupportStaff, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = updateTicketSchema.parse(req.body);
    const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .update(validatedData)
        .eq('id', id)
        .select('*')
        .single();
    if (error || !ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
    }
    // Log the update action
    await supabaseAdmin
        .from('support_audit_log')
        .insert({
        staff_id: req.user.supportId,
        action: 'ticket_updated',
        resource_type: 'ticket',
        resource_id: id,
        details: validatedData
    });
    res.json(ticket);
}));
// ===== USER MANAGEMENT (ADMIN) =====
// Get all users (teachers and students)
router.get('/admin/users', requireSupportStaff, asyncHandler(async (req, res) => {
    const { role, search, page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let teachersQuery = supabaseAdmin
        .from('teachers')
        .select('email, name, subscription_status, created_at, student_count, trial_ends_at')
        .order('created_at', { ascending: false });
    let studentsQuery = supabaseAdmin
        .from('students')
        .select('email, name, student_code, status, created_at, last_login')
        .order('created_at', { ascending: false });
    if (search) {
        teachersQuery = teachersQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
        studentsQuery = studentsQuery.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    const promises = [];
    if (!role || role === 'teacher') {
        const teachersPromise = teachersQuery.range(offset, offset + Number(limit) - 1);
        promises.push(teachersPromise);
    }
    if (!role || role === 'student') {
        const studentsPromise = studentsQuery.range(offset, offset + Number(limit) - 1);
        promises.push(studentsPromise);
    }
    const results = await Promise.all(promises);
    const users = [];
    if (!role || role === 'teacher') {
        const teachers = results[0]?.data || [];
        users.push(...teachers.map((t) => ({ ...t, role: 'teacher' })));
    }
    if (!role || role === 'student') {
        const studentIndex = role === 'teacher' ? 0 : (!role ? 1 : 0);
        const students = results[studentIndex]?.data || [];
        users.push(...students.map((s) => ({ ...s, role: 'student' })));
    }
    // Sort by created_at since we combined results
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ users });
}));
// Get user details with support ticket history
router.get('/admin/users/:email', requireSupportStaff, asyncHandler(async (req, res) => {
    const { email } = req.params;
    // Get user from both teachers and students tables
    const [teacherResult, studentResult, ticketsResult] = await Promise.all([
        supabaseAdmin.from('teachers').select('*').eq('email', email).single(),
        supabaseAdmin.from('students').select('*').eq('email', email).single(),
        supabaseAdmin
            .from('support_tickets')
            .select('id, ticket_number, status, subject, created_at, updated_at')
            .eq('user_email', email)
            .order('created_at', { ascending: false })
    ]);
    const user = teacherResult.data || studentResult.data;
    if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
    }
    const userWithRole = {
        ...user,
        role: teacherResult.data ? 'teacher' : 'student',
        support_tickets: ticketsResult.data || []
    };
    res.json(userWithRole);
}));
// ===== CONTENT MANAGEMENT =====
// Get knowledge base articles
router.get('/knowledge-base', asyncHandler(async (req, res) => {
    const { category, difficulty, status = 'published' } = req.query;
    let query = supabaseAdmin
        .from('knowledge_base_articles')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
    if (category)
        query = query.eq('category', category);
    if (difficulty)
        query = query.eq('difficulty', difficulty);
    const { data: articles, error } = await query;
    if (error) {
        console.error('Get knowledge base error:', error);
        return res.status(500).json({ error: 'articles_fetch_failed' });
    }
    res.json(articles);
}));
// Create/update knowledge base article (admin only)
router.post('/admin/knowledge-base', requireSupportStaff, asyncHandler(async (req, res) => {
    const validatedData = createContentSchema.parse(req.body);
    const { data: article, error } = await supabaseAdmin
        .from('knowledge_base_articles')
        .insert({
        ...validatedData,
        author: req.user.email
    })
        .select('*')
        .single();
    if (error) {
        console.error('Create article error:', error);
        return res.status(500).json({ error: 'article_creation_failed' });
    }
    res.status(201).json(article);
}));
// Get FAQs
router.get('/faq', asyncHandler(async (req, res) => {
    const { category } = req.query;
    let query = supabaseAdmin
        .from('faqs')
        .select('*')
        .order('helpful_count', { ascending: false });
    if (category)
        query = query.eq('category', category);
    const { data: faqs, error } = await query;
    if (error) {
        console.error('Get FAQs error:', error);
        return res.status(500).json({ error: 'faqs_fetch_failed' });
    }
    res.json(faqs);
}));
// Get support categories
router.get('/categories', asyncHandler(async (req, res) => {
    const { data: categories, error } = await supabaseAdmin
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
    if (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ error: 'categories_fetch_failed' });
    }
    res.json(categories);
}));
// Get support staff list
router.get('/admin/staff', requireSupportStaff, asyncHandler(async (req, res) => {
    const { data: staff, error } = await supabaseAdmin
        .from('support_staff')
        .select('id, email, name, role, department, is_active, created_at')
        .eq('is_active', true)
        .order('name');
    if (error) {
        console.error('Get staff error:', error);
        return res.status(500).json({ error: 'staff_fetch_failed' });
    }
    res.json(staff);
}));
// Get dashboard analytics
router.get('/admin/analytics', requireSupportStaff, asyncHandler(async (req, res) => {
    const [totalTickets, openTickets, inProgressTickets, resolvedToday] = await Promise.all([
        supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabaseAdmin
            .from('support_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'resolved')
            .gte('updated_at', new Date().toISOString().split('T')[0])
    ]);
    const analytics = {
        total_tickets: totalTickets.count || 0,
        open_tickets: openTickets.count || 0,
        in_progress_tickets: inProgressTickets.count || 0,
        resolved_today: resolvedToday.count || 0
    };
    res.json(analytics);
}));
export { router };
