import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
// ===== EVENTS MANAGEMENT =====
// Get all events for a user (teacher or student)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { start_date, end_date, event_type, course_id } = req.query;
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get regular events
    let query = supabaseAdmin
        .from('events')
        .select(`
      *,
      courses(title)
    `);
    // Filter by date range if provided
    if (start_date && end_date) {
        query = query
            .gte('start_time', start_date)
            .lte('end_time', end_date);
    }
    // Filter by event type if provided
    if (event_type) {
        query = query.eq('event_type', event_type);
    }
    // Filter by course if provided
    if (course_id) {
        query = query.eq('course_id', course_id);
    }
    let events = [];
    // For teachers, show events they created
    if (userRole === 'teacher') {
        query = query.eq('created_by', userEmail);
        const { data: teacherEvents, error: teacherError } = await query.order('start_time', { ascending: true });
        if (teacherError)
            return res.status(500).json({ error: teacherError.message });
        events = teacherEvents || [];
    }
    else {
        // For students, show public events and events for their courses
        const { data: publicEvents } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('is_public', true)
            .order('start_time', { ascending: true });
        const { data: participantEvents } = await supabaseAdmin
            .from('events')
            .select(`
        *,
        event_participants!inner(participant_email)
      `)
            .eq('event_participants.participant_email', userEmail)
            .order('start_time', { ascending: true });
        // Combine and deduplicate events
        const allEvents = [...(publicEvents || []), ...(participantEvents || [])];
        events = allEvents.filter((event, index, self) => index === self.findIndex(e => e.id === event.id));
    }
    // Get assignments and convert them to events
    let assignmentEvents = [];
    if (userRole === 'teacher') {
        // Get assignments from courses owned by the teacher
        const { data: teacherCourses } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('teacher_email', userEmail);
        if (teacherCourses && teacherCourses.length > 0) {
            const courseIds = teacherCourses.map(c => c.id);
            const { data: assignments } = await supabaseAdmin
                .from('assignments')
                .select(`
          id,
          title,
          description,
          instructions,
          type,
          points,
          due_at,
          available_from,
          available_until,
          course_id,
          courses!inner(title)
        `)
                .in('course_id', courseIds)
                .order('due_at', { ascending: true });
            // Convert assignments to events
            assignmentEvents = (assignments || []).map(assignment => ({
                id: `assignment-${assignment.id}`,
                title: `${assignment.title} (Due)`,
                description: assignment.description || assignment.instructions || `Assignment due for ${assignment.courses.title}`,
                event_type: 'assignment_due',
                start_time: assignment.due_at,
                end_time: assignment.due_at,
                all_day: true,
                location: null,
                course_id: assignment.course_id,
                course: assignment.courses,
                color: '#F97316', // Orange for assignments
                is_public: false,
                requires_rsvp: false,
                created_by: userEmail,
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
                is_assignment: true,
                assignment_id: assignment.id,
                points: assignment.points,
                type: assignment.type
            }));
        }
    }
    else {
        // Get assignments from courses where student is enrolled
        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select(`
        course_id,
        courses!inner(
          id,
          title,
          assignments(
            id,
            title,
            description,
            instructions,
            type,
            points,
            due_at,
            available_from,
            available_until
          )
        )
      `)
            .eq('student_email', userEmail);
        if (enrollments) {
            enrollments.forEach(enrollment => {
                if (enrollment.courses.assignments) {
                    const courseAssignments = enrollment.courses.assignments.map((assignment) => ({
                        id: `assignment-${assignment.id}`,
                        title: `${assignment.title} (Due)`,
                        description: assignment.description || assignment.instructions || `Assignment due for ${enrollment.courses.title}`,
                        event_type: 'assignment_due',
                        start_time: assignment.due_at,
                        end_time: assignment.due_at,
                        all_day: true,
                        location: null,
                        course_id: enrollment.course_id,
                        course: { title: enrollment.courses.title },
                        color: '#F97316', // Orange for assignments
                        is_public: false,
                        requires_rsvp: false,
                        created_by: enrollment.courses.teacher_email,
                        created_at: assignment.created_at,
                        updated_at: assignment.updated_at,
                        is_assignment: true,
                        assignment_id: assignment.id,
                        points: assignment.points,
                        type: assignment.type
                    }));
                    assignmentEvents.push(...courseAssignments);
                }
            });
        }
    }
    // Combine regular events with assignment events
    const allEvents = [...events, ...assignmentEvents];
    // Filter by event type if provided (for assignments)
    if (event_type && event_type === 'assignment_due') {
        const filteredEvents = allEvents.filter(event => event.event_type === 'assignment_due');
        return res.json({ items: filteredEvents });
    }
    // Filter by event type if provided (exclude assignments)
    if (event_type && event_type !== 'assignment_due') {
        const filteredEvents = allEvents.filter(event => event.event_type === event_type);
        return res.json({ items: filteredEvents });
    }
    res.json({ items: allEvents });
}));
// Create a new event
router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const userRole = String(req.headers['x-user-role'] || '').toLowerCase();
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can create events' });
    }
    const { title, description, event_type, start_time, end_time, all_day = false, location, course_id, color = '#3B82F6', recurring_pattern, is_recurring = false, max_participants, is_public = true, requires_rsvp = false, participants = [] } = req.body;
    if (!title || !event_type || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Create the event
    const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .insert({
        title,
        description,
        event_type,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        all_day,
        location,
        course_id,
        created_by: userEmail,
        color,
        recurring_pattern: recurring_pattern ? JSON.stringify(recurring_pattern) : null,
        is_recurring,
        max_participants,
        is_public,
        requires_rsvp
    })
        .select()
        .single();
    if (eventError)
        return res.status(500).json({ error: eventError.message });
    // Add participants if provided
    if (participants.length > 0) {
        const participantData = participants.map((email) => ({
            event_id: event.id,
            participant_email: email.toLowerCase(),
            role: 'invited',
            rsvp_status: 'pending'
        }));
        await supabaseAdmin
            .from('event_participants')
            .insert(participantData);
    }
    // Add creator as host
    await supabaseAdmin
        .from('event_participants')
        .insert({
        event_id: event.id,
        participant_email: userEmail,
        role: 'host',
        rsvp_status: 'accepted'
    });
    res.json(event);
}));
// Update an event
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { id } = req.params;
    const updateData = req.body;
    // Check if user owns the event
    const { data: existingEvent } = await supabaseAdmin
        .from('events')
        .select('created_by')
        .eq('id', id)
        .single();
    if (!existingEvent || existingEvent.created_by !== userEmail) {
        return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    const { data, error } = await supabaseAdmin
        .from('events')
        .update({
        ...updateData,
        updated_at: new Date()
    })
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Delete an event
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { id } = req.params;
    // Check if user owns the event
    const { data: existingEvent } = await supabaseAdmin
        .from('events')
        .select('created_by')
        .eq('id', id)
        .single();
    if (!existingEvent || existingEvent.created_by !== userEmail) {
        return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    const { error } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ message: 'Event deleted successfully' });
}));
// RSVP to an event
router.post('/:id/rsvp', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { id } = req.params;
    const { rsvp_status } = req.body;
    if (!['accepted', 'declined', 'maybe'].includes(rsvp_status)) {
        return res.status(400).json({ error: 'Invalid RSVP status' });
    }
    // Check if user is invited to the event
    const { data: participant } = await supabaseAdmin
        .from('event_participants')
        .select('*')
        .eq('event_id', id)
        .eq('participant_email', userEmail)
        .single();
    if (!participant) {
        return res.status(404).json({ error: 'Not invited to this event' });
    }
    const { data, error } = await supabaseAdmin
        .from('event_participants')
        .update({ rsvp_status })
        .eq('event_id', id)
        .eq('participant_email', userEmail)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// ===== OFFICE HOURS MANAGEMENT =====
// Get office hours for a teacher
router.get('/office-hours/:teacherEmail', requireAuth, asyncHandler(async (req, res) => {
    const { teacherEmail } = req.params;
    const { data, error } = await supabaseAdmin
        .from('office_hours')
        .select('*')
        .eq('teacher_email', teacherEmail.toLowerCase())
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
// Create office hours (teachers only)
router.post('/office-hours', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const userRole = String(req.headers['x-user-role'] || '').toLowerCase();
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can create office hours' });
    }
    const { day_of_week, start_time, end_time, location, is_virtual = false, meeting_link, max_students_per_slot = 1, slot_duration_minutes = 30 } = req.body;
    if (day_of_week < 0 || day_of_week > 6) {
        return res.status(400).json({ error: 'Invalid day of week' });
    }
    const { data, error } = await supabaseAdmin
        .from('office_hours')
        .insert({
        teacher_email: userEmail,
        day_of_week,
        start_time,
        end_time,
        location,
        is_virtual,
        meeting_link,
        max_students_per_slot,
        slot_duration_minutes
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Book office hours appointment
router.post('/office-hours/:officeHourId/book', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { officeHourId } = req.params;
    const { appointment_date, start_time, end_time, topic } = req.body;
    // Check if office hour exists and is active
    const { data: officeHour } = await supabaseAdmin
        .from('office_hours')
        .select('*')
        .eq('id', officeHourId)
        .eq('is_active', true)
        .single();
    if (!officeHour) {
        return res.status(404).json({ error: 'Office hours not found or inactive' });
    }
    // Check for conflicts
    const { data: conflicts } = await supabaseAdmin
        .from('office_hour_appointments')
        .select('*')
        .eq('office_hour_id', officeHourId)
        .eq('appointment_date', appointment_date)
        .filter('start_time', 'gte', start_time)
        .filter('end_time', 'lte', end_time);
    if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ error: 'Time slot is already booked' });
    }
    const { data, error } = await supabaseAdmin
        .from('office_hour_appointments')
        .insert({
        office_hour_id: officeHourId,
        student_email: userEmail,
        appointment_date,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        topic
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Get office hours appointments for a teacher
router.get('/office-hours/appointments', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const userRole = String(req.headers['x-user-role'] || '').toLowerCase();
    const { start_date, end_date } = req.query;
    let query = supabaseAdmin
        .from('office_hour_appointments')
        .select(`
      *,
      office_hours!inner(teacher_email, location, is_virtual, meeting_link)
    `);
    if (userRole === 'teacher') {
        query = query.eq('office_hours.teacher_email', userEmail);
    }
    else {
        query = query.eq('student_email', userEmail);
    }
    if (start_date && end_date) {
        query = query
            .gte('appointment_date', start_date)
            .lte('appointment_date', end_date);
    }
    const { data, error } = await query.order('start_time', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
// ===== STUDY GROUPS MANAGEMENT =====
// Get study groups
router.get('/study-groups', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { course_id, is_public } = req.query;
    let query = supabaseAdmin
        .from('study_groups')
        .select(`
      *,
      courses(title),
      study_group_participants!inner(student_email)
    `);
    if (course_id) {
        query = query.eq('course_id', course_id);
    }
    if (is_public !== undefined) {
        query = query.eq('is_public', is_public === 'true');
    }
    // Show groups user is part of or public groups
    query = query.or(`study_group_participants.student_email.eq.${userEmail},is_public.eq.true`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
// Create study group
router.post('/study-groups', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { name, description, course_id, max_participants = 10, is_public = true, meeting_link } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }
    const { data: group, error: groupError } = await supabaseAdmin
        .from('study_groups')
        .insert({
        name,
        description,
        course_id,
        created_by: userEmail,
        max_participants,
        is_public,
        meeting_link
    })
        .select()
        .single();
    if (groupError)
        return res.status(500).json({ error: groupError.message });
    // Add creator as participant
    await supabaseAdmin
        .from('study_group_participants')
        .insert({
        study_group_id: group.id,
        student_email: userEmail,
        role: 'creator'
    });
    res.json(group);
}));
// Join study group
router.post('/study-groups/:groupId/join', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { groupId } = req.params;
    // Check if group exists and has space
    const { data: group } = await supabaseAdmin
        .from('study_groups')
        .select('max_participants')
        .eq('id', groupId)
        .single();
    if (!group) {
        return res.status(404).json({ error: 'Study group not found' });
    }
    // Check current participant count
    const { count } = await supabaseAdmin
        .from('study_group_participants')
        .select('*', { count: 'exact' })
        .eq('study_group_id', groupId);
    if (count && count >= group.max_participants) {
        return res.status(409).json({ error: 'Study group is full' });
    }
    const { data, error } = await supabaseAdmin
        .from('study_group_participants')
        .insert({
        study_group_id: groupId,
        student_email: userEmail,
        role: 'member'
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Create study group session
router.post('/study-groups/:groupId/sessions', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { groupId } = req.params;
    const { title, description, start_time, end_time, location, is_virtual = false, meeting_link, max_participants } = req.body;
    // Check if user is the creator of the study group
    const { data: group } = await supabaseAdmin
        .from('study_groups')
        .select('created_by')
        .eq('id', groupId)
        .single();
    if (!group || group.created_by !== userEmail) {
        return res.status(403).json({ error: 'Only group creator can create sessions' });
    }
    const { data, error } = await supabaseAdmin
        .from('study_group_sessions')
        .insert({
        study_group_id: groupId,
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        location,
        is_virtual,
        meeting_link,
        max_participants
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Get study group sessions
router.get('/study-groups/:groupId/sessions', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { groupId } = req.params;
    // Check if user is part of the study group
    const { data: participant } = await supabaseAdmin
        .from('study_group_participants')
        .select('*')
        .eq('study_group_id', groupId)
        .eq('student_email', userEmail)
        .single();
    if (!participant) {
        return res.status(403).json({ error: 'Not a member of this study group' });
    }
    const { data, error } = await supabaseAdmin
        .from('study_group_sessions')
        .select(`
      *,
      study_session_participants!inner(student_email, rsvp_status, attended)
    `)
        .eq('study_group_id', groupId)
        .order('start_time', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
// RSVP to study group session
router.post('/study-groups/sessions/:sessionId/rsvp', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = String(req.headers['x-user-email'] || '').toLowerCase();
    const { sessionId } = req.params;
    const { rsvp_status } = req.body;
    if (!['accepted', 'declined', 'maybe'].includes(rsvp_status)) {
        return res.status(400).json({ error: 'Invalid RSVP status' });
    }
    const { data, error } = await supabaseAdmin
        .from('study_session_participants')
        .upsert({
        session_id: sessionId,
        student_email: userEmail,
        rsvp_status
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
export default router;
