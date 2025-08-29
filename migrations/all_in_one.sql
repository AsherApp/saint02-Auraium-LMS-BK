-- RUN THIS FILE ONCE IN SUPABASE SQL EDITOR
-- Order: base schema → course settings/roster view → auth extras → RLS policies

-- Ensure needed extensions for UUID generation
create extension if not exists pgcrypto;

-- ===== Base schema =====
-- Core tables (Supabase Postgres). Enable RLS and add policies appropriately.

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  bio text,
  avatar_url text,
  website text,
  location text,
  expertise text,
  education text,
  experience text,
  subscription_status text not null default 'free',
  max_students_allowed int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  status text not null default 'active', -- active | suspended | invited
  -- Comprehensive profile fields
  first_name text,
  last_name text,
  student_code text unique,
  date_of_birth date,
  phone_number text,
  address text,
  city text,
  state text,
  country text default 'United States',
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  academic_level text, -- freshman, sophomore, junior, senior, graduate, etc.
  major text,
  minor text,
  graduation_year integer,
  gpa decimal(3,2),
  academic_interests text,
  career_goals text,
  bio text,
  avatar_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  timezone text default 'UTC',
  preferred_language text default 'English',
  accessibility_needs text,
  dietary_restrictions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Teacher settings table
create table if not exists teacher_settings (
  id uuid primary key default gen_random_uuid(),
  teacher_email text not null references teachers(email) on delete cascade,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_email)
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  teacher_email text not null references teachers(email) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  unique(course_id, student_email)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  scope jsonb not null,
  title text not null,
  description text,
  type text not null,
  due_at timestamptz,
  form jsonb,
  resources jsonb,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  status text not null default 'draft',
  payload jsonb not null default '{}',
  grade int,
  feedback text,
  graded_by text references teachers(email),
  graded_at timestamptz,
  submitted_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id, student_email)
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  teacher_email text not null references teachers(email) on delete cascade,
  message text not null,
  updated_at timestamptz not null default now()
);

-- Invites (student onboarding)
create table if not exists invites (
  code text primary key,
  email text not null,
  name text,
  role text not null default 'student',
  course_id uuid references courses(id) on delete set null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Modules & Lessons (optional content persistence)
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position int not null default 0
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  type text not null, -- video | quiz | file | discussion | poll
  content jsonb,
  position int not null default 0
);

-- Live classes
create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'scheduled', -- scheduled | live | ended
  teacher_email text not null references teachers(email) on delete cascade,
  host_email text not null references teachers(email) on delete cascade,
  session_type text not null default 'general', -- general | course | module
  is_started boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enhanced live session attendance tracking
create table if not exists live_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('host', 'student', 'guest')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds integer default 0,
  attendance_status text not null default 'present' check (attendance_status in ('present', 'late', 'absent', 'excused')),
  participation_score integer default 0 check (participation_score >= 0 and participation_score <= 100),
  notes text,
  device_info jsonb default '{}',
  connection_quality text check (connection_quality in ('excellent', 'good', 'fair', 'poor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, email)
);

-- Live session attendance records for detailed tracking
create table if not exists live_attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  total_duration_seconds integer default 0,
  attendance_percentage numeric(5,2) default 0 check (attendance_percentage >= 0 and attendance_percentage <= 100),
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'excused', 'left_early')),
  late_minutes integer default 0,
  early_leave_minutes integer default 0,
  participation_activities integer default 0, -- count of polls, quizzes, etc. participated in
  engagement_score integer default 0 check (engagement_score >= 0 and engagement_score <= 100),
  teacher_notes text,
  student_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Live session attendance settings and policies
create table if not exists live_attendance_settings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  teacher_email text not null references teachers(email) on delete cascade,
  late_threshold_minutes integer default 15, -- minutes after start time to be considered late
  absence_threshold_minutes integer default 30, -- minutes after start time to be considered absent
  minimum_attendance_percentage numeric(5,2) default 75.00, -- minimum attendance required
  auto_mark_absent boolean default true, -- automatically mark students absent if they don't join
  require_checkout boolean default false, -- require students to check out when leaving
  participation_tracking boolean default true, -- track participation in activities
  attendance_notes_required boolean default false, -- require notes for absences
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, teacher_email)
);

-- Live session attendance reports and analytics
create table if not exists live_attendance_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  total_enrolled_students integer not null default 0,
  present_count integer not null default 0,
  late_count integer not null default 0,
  absent_count integer not null default 0,
  excused_count integer not null default 0,
  average_attendance_percentage numeric(5,2) default 0,
  average_participation_score numeric(5,2) default 0,
  average_engagement_score numeric(5,2) default 0,
  session_duration_minutes integer default 0,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Live polls
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  question text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  closed boolean not null default false
);

-- Live quizzes and classwork
create table if not exists live_quizzes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  title text not null,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists live_quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references live_quizzes(id) on delete cascade,
  student_email text not null,
  answers jsonb not null,
  score numeric,
  submitted_at timestamptz not null default now(),
  unique(quiz_id, student_email)
);

create table if not exists live_classwork (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists live_classwork_submissions (
  id uuid primary key default gen_random_uuid(),
  classwork_id uuid not null references live_classwork(id) on delete cascade,
  student_email text not null,
  payload jsonb not null,
  grade int,
  feedback text,
  submitted_at timestamptz not null default now(),
  unique(classwork_id, student_email)
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  voter_email text not null,
  unique(poll_id, voter_email)
);

-- Live chat & resources
create table if not exists live_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  from_email text not null,
  text text not null,
  at timestamptz not null default now()
);

create table if not exists live_resources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  title text not null,
  url text,
  uploader_email text not null,
  at timestamptz not null default now()
);

-- Live notes (per user per session)
create table if not exists live_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  author_email text not null,
  content text not null,
  updated_at timestamptz not null default now(),
  unique(session_id, author_email)
);

-- Whiteboard (optional persistence)
create table if not exists whiteboard_strokes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  by_email text not null,
  color text not null,
  width int not null,
  points jsonb not null,
  at timestamptz not null default now()
);

-- Profiles (optional server-side)
create table if not exists profiles (
  user_id text primary key,
  name text,
  avatar_url text,
  bio text
);

-- Inbox messaging
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  from_email text not null,
  subject text not null,
  content text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  read boolean not null default false,
  starred boolean not null default false,
  archived boolean not null default false,
  thread_id uuid,
  parent_id uuid references messages(id) on delete set null,
  attachments jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Discussion Forum =====

-- Forum categories
create table if not exists forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text default '#3B82F6',
  icon text default 'message-circle',
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Forum topics/threads
create table if not exists forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references forum_categories(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  content text not null,
  author_email text not null,
  author_role text not null check (author_role in ('teacher', 'student')),
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  is_announcement boolean not null default false,
  view_count int not null default 0,
  reply_count int not null default 0,
  last_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Forum replies/posts
create table if not exists forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references forum_topics(id) on delete cascade,
  parent_reply_id uuid references forum_replies(id) on delete cascade,
  content text not null,
  author_email text not null,
  author_role text not null check (author_role in ('teacher', 'student')),
  is_solution boolean not null default false,
  is_edited boolean not null default false,
  edited_at timestamptz,
  edited_by text,
  upvotes int not null default 0,
  downvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Forum votes
create table if not exists forum_votes (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references forum_replies(id) on delete cascade,
  voter_email text not null,
  vote_type text not null check (vote_type in ('upvote', 'downvote')),
  created_at timestamptz not null default now(),
  unique(reply_id, voter_email)
);

-- Forum subscriptions (for notifications)
create table if not exists forum_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  topic_id uuid references forum_topics(id) on delete cascade,
  category_id uuid references forum_categories(id) on delete cascade,
  subscription_type text not null check (subscription_type in ('topic', 'category')),
  created_at timestamptz not null default now(),
  unique(user_email, topic_id, category_id)
);

-- Forum tags
create table if not exists forum_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#6B7280',
  created_at timestamptz not null default now()
);

-- Forum topic tags (many-to-many relationship)
create table if not exists forum_topic_tags (
  topic_id uuid not null references forum_topics(id) on delete cascade,
  tag_id uuid not null references forum_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, tag_id)
);

-- ===== Event Management & Scheduling =====

-- Events table for comprehensive event management
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('live_session', 'assignment_due', 'exam', 'office_hours', 'study_group', 'announcement', 'custom')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  location text, -- physical location or virtual meeting link
  course_id uuid references courses(id) on delete cascade,
  created_by text not null references teachers(email) on delete cascade,
  color text default '#3B82F6', -- hex color for calendar display
  recurring_pattern text, -- JSON string for recurring events
  is_recurring boolean not null default false,
  max_participants integer,
  is_public boolean not null default true, -- whether students can see this event
  requires_rsvp boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event participants (for RSVP and attendance tracking)
create table if not exists event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  participant_email text not null,
  role text not null check (role in ('host', 'attendee', 'invited')),
  rsvp_status text check (rsvp_status in ('pending', 'accepted', 'declined', 'maybe')),
  attended boolean default false,
  joined_at timestamptz,
  left_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(event_id, participant_email)
);

-- Event reminders and notifications
create table if not exists event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('email', 'push', 'sms')),
  reminder_time timestamptz not null, -- when to send the reminder
  sent boolean not null default false,
  sent_at timestamptz,
  recipient_email text not null,
  created_at timestamptz not null default now()
);

-- Office hours scheduling
create table if not exists office_hours (
  id uuid primary key default gen_random_uuid(),
  teacher_email text not null references teachers(email) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  location text,
  is_virtual boolean not null default false,
  meeting_link text,
  max_students_per_slot integer default 1,
  slot_duration_minutes integer default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Office hours appointments
create table if not exists office_hour_appointments (
  id uuid primary key default gen_random_uuid(),
  office_hour_id uuid not null references office_hours(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  appointment_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  topic text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Study group sessions
create table if not exists study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  course_id uuid references courses(id) on delete cascade,
  created_by text not null references students(email) on delete cascade,
  max_participants integer default 10,
  is_public boolean not null default true,
  meeting_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Study group sessions
create table if not exists study_group_sessions (
  id uuid primary key default gen_random_uuid(),
  study_group_id uuid not null references study_groups(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  is_virtual boolean not null default false,
  meeting_link text,
  max_participants integer,
  created_at timestamptz not null default now()
);

-- Study group participants
create table if not exists study_group_participants (
  id uuid primary key default gen_random_uuid(),
  study_group_id uuid not null references study_groups(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  role text not null default 'member' check (role in ('creator', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  unique(study_group_id, student_email)
);

-- Study group session participants
create table if not exists study_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_group_sessions(id) on delete cascade,
  student_email text not null references students(email) on delete cascade,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'accepted', 'declined', 'maybe')),
  attended boolean default false,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, student_email)
);

-- ===== Course settings and roster view =====

alter table courses
  add column if not exists status text not null default 'draft' check (status in ('draft','published','archived')),
  add column if not exists visibility text not null default 'private' check (visibility in ('private','unlisted','public')),
  add column if not exists enrollment_policy text not null default 'invite_only' check (enrollment_policy in ('invite_only','request','open')),
  add column if not exists published_at timestamptz;

create index if not exists idx_courses_status on courses(status);
create index if not exists idx_courses_visibility on courses(visibility);

create or replace view course_roster as
  select
    e.course_id,
    e.student_email as email,
    coalesce(s.name, e.student_email) as name,
    'active'::text as state,
    null::text as invite_code,
    null::timestamptz as invited_at
  from enrollments e
  left join students s on s.email = e.student_email
  union all
  select
    i.course_id,
    i.email,
    coalesce(i.name, i.email) as name,
    'pending'::text as state,
    i.code as invite_code,
    i.created_at as invited_at
  from invites i
  where i.course_id is not null and i.used = false;

create index if not exists idx_invites_course_pending on invites(course_id) where used = false;

-- ===== Auth extras (student login codes, user_roles view) =====

create table if not exists student_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null references students(email) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  unique(email, code)
);

create index if not exists idx_student_login_codes_email_active
  on student_login_codes(email)
  where used = false;

create or replace view user_roles as
  select email, 'teacher'::text as role from teachers
  union
  select email, 'student'::text as role from students;

-- ===== RLS policies =====

-- Helpers
create or replace function public.is_course_teacher(c_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from courses c where c.id = c_id and lower(c.teacher_email) = lower(auth.email())
  );
$$;

create or replace function public.is_enrolled(c_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from enrollments e where e.course_id = c_id and lower(e.student_email) = lower(auth.email())
  );
$$;

-- Teachers
alter table teachers enable row level security;
create policy teachers_self_select on teachers
  for select using (lower(email) = lower(auth.email()));
create policy teachers_self_update on teachers
  for update using (lower(email) = lower(auth.email()));

-- Students
alter table students enable row level security;
create policy students_self_select on students
  for select using (lower(email) = lower(auth.email()));
create policy students_self_update on students
  for update using (lower(email) = lower(auth.email()));
create policy students_teacher_roster_select on students
  for select using (
    exists(
      select 1 from enrollments e
      where e.student_email = students.email
        and is_course_teacher(e.course_id)
    )
  );

-- Profiles
alter table profiles enable row level security;
create policy profiles_self_rw on profiles for all using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

-- Courses
alter table courses enable row level security;
create policy courses_teacher_rw on courses for all using (is_course_teacher(id)) with check (is_course_teacher(id));
create policy courses_student_read on courses for select using (is_enrolled(id));
create policy courses_public_read on courses for select using (status = 'published' and visibility = 'public');

-- Enrollments
alter table enrollments enable row level security;
create policy enrollments_teacher_rw on enrollments for all using (is_course_teacher(course_id)) with check (is_course_teacher(course_id));
create policy enrollments_student_read on enrollments for select using (lower(student_email) = lower(auth.email()));

-- Assignments
alter table assignments enable row level security;
create policy assignments_teacher_rw on assignments for all using (is_course_teacher(course_id)) with check (is_course_teacher(course_id));
create policy assignments_student_read on assignments for select using (is_enrolled(course_id));

-- Submissions
alter table submissions enable row level security;
create policy submissions_student_rw on submissions for all using (lower(student_email) = lower(auth.email())) with check (lower(student_email) = lower(auth.email()));
create policy submissions_teacher_read on submissions for select using (
  exists(select 1 from assignments a where a.id = submissions.assignment_id and is_course_teacher(a.course_id))
);
create policy submissions_teacher_grade on submissions for update using (
  exists(select 1 from assignments a where a.id = submissions.assignment_id and is_course_teacher(a.course_id))
);

-- Invites (teachers only)
alter table invites enable row level security;
create policy invites_teacher_rw on invites for all using (
  course_id is null or is_course_teacher(course_id)
) with check (
  course_id is null or is_course_teacher(course_id)
);

-- Announcements
alter table announcements enable row level security;
create policy announcements_teacher_rw on announcements for all using (lower(teacher_email) = lower(auth.email())) with check (lower(teacher_email) = lower(auth.email()));
create policy announcements_student_read on announcements for select using (
  exists(
    select 1 from courses c
    where c.teacher_email = announcements.teacher_email and is_enrolled(c.id)
  )
);

-- Live sessions and related
alter table live_sessions enable row level security;
create policy live_teacher_rw on live_sessions for all using (is_course_teacher(course_id)) with check (is_course_teacher(course_id));
create policy live_student_read on live_sessions for select using (is_enrolled(course_id));

alter table live_participants enable row level security;
create policy live_participants_rw on live_participants for all using (
  exists(select 1 from live_sessions s where s.id = live_participants.session_id and (is_course_teacher(s.course_id) or lower(live_participants.email)=lower(auth.email())))
) with check (
  exists(select 1 from live_sessions s where s.id = live_participants.session_id and (is_course_teacher(s.course_id) or lower(live_participants.email)=lower(auth.email())))
);

alter table live_messages enable row level security;
create policy live_messages_rw on live_messages for all using (
  exists(select 1 from live_sessions s where s.id = live_messages.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
) with check (
  exists(select 1 from live_sessions s where s.id = live_messages.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
);

alter table live_resources enable row level security;
create policy live_resources_rw on live_resources for all using (
  exists(select 1 from live_sessions s where s.id = live_resources.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
) with check (
  exists(select 1 from live_sessions s where s.id = live_resources.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
);

alter table polls enable row level security;
create policy polls_teacher_rw on polls for all using (
  exists(select 1 from live_sessions s where s.id = polls.session_id and is_course_teacher(s.course_id))
) with check (
  exists(select 1 from live_sessions s where s.id = polls.session_id and is_course_teacher(s.course_id))
);
create policy polls_student_read on polls for select using (
  exists(select 1 from live_sessions s where s.id = polls.session_id and is_enrolled(s.course_id))
);

alter table poll_options enable row level security;
create policy poll_options_read on poll_options for select using (
  exists(select 1 from polls p join live_sessions s on s.id = p.session_id where p.id = poll_options.poll_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
);
create policy poll_options_teacher_ins on poll_options for insert with check (
  exists(select 1 from polls p join live_sessions s on s.id = p.session_id where p.id = poll_options.poll_id and is_course_teacher(s.course_id))
);

alter table poll_votes enable row level security;
create policy poll_votes_student_ins on poll_votes for insert with check (
  exists(select 1 from polls p join live_sessions s on s.id = p.session_id where p.id = poll_votes.poll_id and is_enrolled(s.course_id))
);
create policy poll_votes_read on poll_votes for select using (
  exists(select 1 from polls p join live_sessions s on s.id = p.session_id where p.id = poll_votes.poll_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
);

alter table whiteboard_strokes enable row level security;
create policy strokes_rw on whiteboard_strokes for all using (
  exists(select 1 from live_sessions s where s.id = whiteboard_strokes.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
) with check (
  exists(select 1 from live_sessions s where s.id = whiteboard_strokes.session_id and (is_course_teacher(s.course_id) or is_enrolled(s.course_id)))
);

-- In-class activities
alter table live_notes enable row level security;
create policy notes_self_rw on live_notes for all using (lower(author_email) = lower(auth.email())) with check (lower(author_email) = lower(auth.email()));
create policy notes_teacher_read on live_notes for select using (
  exists(select 1 from live_sessions s where s.id = live_notes.session_id and is_course_teacher(s.course_id))
);

alter table live_quizzes enable row level security;
create policy quizzes_teacher_rw on live_quizzes for all using (
  exists(select 1 from live_sessions s where s.id = live_quizzes.session_id and is_course_teacher(s.course_id))
) with check (
  exists(select 1 from live_sessions s where s.id = live_quizzes.session_id and is_course_teacher(s.course_id))
);
create policy quizzes_student_read on live_quizzes for select using (
  exists(select 1 from live_sessions s where s.id = live_quizzes.session_id and is_enrolled(s.course_id))
);

alter table live_quiz_responses enable row level security;
create policy quiz_resp_student_rw on live_quiz_responses for all using (lower(student_email) = lower(auth.email())) with check (lower(student_email) = lower(auth.email()));
create policy quiz_resp_teacher_read on live_quiz_responses for select using (
  exists(select 1 from live_quizzes q join live_sessions s on s.id = q.session_id where q.id = live_quiz_responses.quiz_id and is_course_teacher(s.course_id))
);

-- ===== Live Attendance RLS Policies =====

-- Enhanced live participants
alter table live_participants enable row level security;
create policy live_participants_self_rw on live_participants for all using (lower(email) = lower(auth.email())) with check (lower(email) = lower(auth.email()));
create policy live_participants_teacher_read on live_participants for select using (
  exists(select 1 from live_sessions s where s.id = live_participants.session_id and is_course_teacher(s.course_id))
);

-- Live attendance records
alter table live_attendance_records enable row level security;
create policy attendance_records_student_rw on live_attendance_records for all using (lower(student_email) = lower(auth.email())) with check (lower(student_email) = lower(auth.email()));
create policy attendance_records_teacher_rw on live_attendance_records for all using (
  exists(select 1 from live_sessions s where s.id = live_attendance_records.session_id and is_course_teacher(s.course_id))
) with check (
  exists(select 1 from live_sessions s where s.id = live_attendance_records.session_id and is_course_teacher(s.course_id))
);

-- Live attendance settings
alter table live_attendance_settings enable row level security;
create policy attendance_settings_teacher_rw on live_attendance_settings for all using (teacher_email = auth.email()) with check (teacher_email = auth.email());
create policy attendance_settings_student_read on live_attendance_settings for select using (
  exists(select 1 from enrollments e where e.course_id = live_attendance_settings.course_id and e.student_email = auth.email())
);

-- Live attendance reports
alter table live_attendance_reports enable row level security;
create policy attendance_reports_teacher_rw on live_attendance_reports for all using (
  exists(select 1 from live_sessions s where s.id = live_attendance_reports.session_id and is_course_teacher(s.course_id))
) with check (
  exists(select 1 from live_sessions s where s.id = live_attendance_reports.session_id and is_course_teacher(s.course_id))
);
create policy attendance_reports_student_read on live_attendance_reports for select using (
  exists(select 1 from live_sessions s 
         join enrollments e on e.course_id = s.course_id 
         where s.id = live_attendance_reports.session_id and e.student_email = auth.email())
);

alter table live_classwork enable row level security;
create policy classwork_teacher_rw on live_classwork for all using (
  exists(select 1 from live_sessions s where s.id = live_classwork.session_id and is_course_teacher(s.course_id))
) with check (
  exists(select 1 from live_sessions s where s.id = live_classwork.session_id and is_course_teacher(s.course_id))
);
create policy classwork_student_read on live_classwork for select using (
  exists(select 1 from live_sessions s where s.id = live_classwork.session_id and is_enrolled(s.course_id))
);

alter table live_classwork_submissions enable row level security;
create policy classwork_sub_student_rw on live_classwork_submissions for all using (lower(student_email) = lower(auth.email())) with check (lower(student_email) = lower(auth.email()));
create policy classwork_sub_teacher_read on live_classwork_submissions for select using (
  exists(select 1 from live_classwork c join live_sessions s on s.id = c.session_id where c.id = live_classwork_submissions.classwork_id and is_course_teacher(s.course_id))
);

-- Inbox
alter table messages enable row level security;
create policy messages_rw on messages for all using (lower(to_email)=lower(auth.email()) or lower(from_email)=lower(auth.email())) with check (lower(from_email)=lower(auth.email()));

-- ===== Event Management RLS Policies =====

-- Events
alter table events enable row level security;
create policy events_teacher_rw on events for all using (created_by = auth.email()) with check (created_by = auth.email());
create policy events_student_read on events for select using (
  is_public = true or 
  exists(select 1 from enrollments e where e.course_id = events.course_id and e.student_email = auth.email())
);

-- Event participants
alter table event_participants enable row level security;
create policy event_participants_self_rw on event_participants for all using (participant_email = auth.email()) with check (participant_email = auth.email());
create policy event_participants_teacher_read on event_participants for select using (
  exists(select 1 from events e where e.id = event_participants.event_id and e.created_by = auth.email())
);

-- Event reminders
alter table event_reminders enable row level security;
create policy event_reminders_recipient_rw on event_reminders for all using (recipient_email = auth.email()) with check (recipient_email = auth.email());
create policy event_reminders_teacher_read on event_reminders for select using (
  exists(select 1 from events e where e.id = event_reminders.event_id and e.created_by = auth.email())
);

-- Office hours
alter table office_hours enable row level security;
create policy office_hours_teacher_rw on office_hours for all using (teacher_email = auth.email()) with check (teacher_email = auth.email());
create policy office_hours_student_read on office_hours for select using (is_active = true);

-- Office hour appointments
alter table office_hour_appointments enable row level security;
create policy office_hour_appointments_student_rw on office_hour_appointments for all using (student_email = auth.email()) with check (student_email = auth.email());
create policy office_hour_appointments_teacher_read on office_hour_appointments for select using (
  exists(select 1 from office_hours oh where oh.id = office_hour_appointments.office_hour_id and oh.teacher_email = auth.email())
);

-- Study groups
alter table study_groups enable row level security;
create policy study_groups_creator_rw on study_groups for all using (created_by = auth.email()) with check (created_by = auth.email());
create policy study_groups_public_read on study_groups for select using (is_public = true);

-- Study group participants
alter table study_group_participants enable row level security;
create policy study_group_participants_self_rw on study_group_participants for all using (student_email = auth.email()) with check (student_email = auth.email());
create policy study_group_participants_creator_read on study_group_participants for select using (
  exists(select 1 from study_groups sg where sg.id = study_group_participants.study_group_id and sg.created_by = auth.email())
);

-- Study group sessions
alter table study_group_sessions enable row level security;
create policy study_group_sessions_creator_rw on study_group_sessions for all using (
  exists(select 1 from study_groups sg where sg.id = study_group_sessions.study_group_id and sg.created_by = auth.email())
) with check (
  exists(select 1 from study_groups sg where sg.id = study_group_sessions.study_group_id and sg.created_by = auth.email())
);
create policy study_group_sessions_participant_read on study_group_sessions for select using (
  exists(select 1 from study_group_participants sgp where sgp.study_group_id = study_group_sessions.study_group_id and sgp.student_email = auth.email())
);

-- Study session participants
alter table study_session_participants enable row level security;
create policy study_session_participants_self_rw on study_session_participants for all using (student_email = auth.email()) with check (student_email = auth.email());
create policy study_session_participants_creator_read on study_session_participants for select using (
  exists(select 1 from study_group_sessions sgs 
         join study_groups sg on sg.id = sgs.study_group_id 
         where sgs.id = study_session_participants.session_id and sg.created_by = auth.email())
);

-- Student login codes (service role only)
alter table student_login_codes enable row level security;
-- No public policies: access via backend with service role only

-- ===== Student Progress and Activity Tracking =====

-- Track student progress through course modules and lessons
create table if not exists student_progress (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  module_id text, -- Module identifier (could be UUID or string)
  lesson_id text, -- Lesson identifier
  lesson_title text,
  completed_at timestamptz not null default now(),
  time_spent_seconds integer default 0, -- Time spent on this lesson
  score integer, -- Optional score for graded lessons
  status text not null default 'completed', -- completed, in_progress, failed
  metadata jsonb default '{}', -- Additional data like quiz scores, etc.
  unique(student_email, course_id, lesson_id)
);

-- Track student activities (logins, study sessions, etc.)
create table if not exists student_activities (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid references courses(id) on delete cascade, -- nullable for general activities
  activity_type text not null, -- login, study_session, assignment_submission, quiz_taken, live_session_attended
  description text,
  metadata jsonb default '{}', -- Additional activity data
  created_at timestamptz not null default now()
);

-- Track student grades and performance
create table if not exists student_grades (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade, -- nullable for overall course grades
  grade_type text not null, -- assignment, quiz, overall_course, module
  grade_percentage integer not null check (grade_percentage >= 0 and grade_percentage <= 100),
  max_possible_score integer,
  actual_score integer,
  feedback text,
  graded_by text references teachers(email), -- who graded this
  graded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Track student engagement metrics
create table if not exists student_engagement (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  date date not null,
  login_count integer default 0,
  total_session_time_seconds integer default 0,
  lessons_completed integer default 0,
  assignments_submitted integer default 0,
  forum_posts integer default 0,
  live_sessions_attended integer default 0,
  participation_score integer default 0, -- 0-100
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_email, course_id, date)
);

-- Course modules and lessons structure
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null,
  content_type text not null, -- video, text, quiz, assignment
  content_url text, -- URL to lesson content
  duration_minutes integer default 0,
  order_index integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_student_progress_student_course on student_progress(student_email, course_id);
create index if not exists idx_student_progress_lesson on student_progress(lesson_id);
create index if not exists idx_student_activities_student on student_activities(student_email);
create index if not exists idx_student_activities_course on student_activities(course_id);
create index if not exists idx_student_activities_type on student_activities(activity_type);
create index if not exists idx_student_grades_student_course on student_grades(student_email, course_id);
create index if not exists idx_student_engagement_student_course on student_engagement(student_email, course_id);
create index if not exists idx_student_engagement_date on student_engagement(date);
create index if not exists idx_course_modules_course on course_modules(course_id);
create index if not exists idx_course_lessons_module on course_lessons(module_id);

-- Enable RLS
alter table student_progress enable row level security;
alter table student_activities enable row level security;
alter table student_grades enable row level security;
alter table student_engagement enable row level security;
alter table course_modules enable row level security;
alter table course_lessons enable row level security;

-- RLS Policies
-- Students can view their own progress
create policy student_progress_self_select on student_progress
  for select using (student_email = auth.email());

-- Teachers can view progress of students in their courses
create policy student_progress_teacher_select on student_progress
  for select using (
    exists(
      select 1 from courses c 
      where c.id = student_progress.course_id 
      and c.teacher_email = auth.email()
    )
  );

create policy student_activities_self_select on student_activities
  for select using (student_email = auth.email());

create policy student_activities_teacher_select on student_activities
  for select using (
    exists(
      select 1 from courses c 
      where c.id = student_activities.course_id 
      and c.teacher_email = auth.email()
    )
  );

create policy student_grades_self_select on student_grades
  for select using (student_email = auth.email());

create policy student_grades_teacher_select on student_grades
  for select using (
    exists(
      select 1 from courses c 
      where c.id = student_grades.course_id 
      and c.teacher_email = auth.email()
    )
  );

-- Functions to calculate progress and grades
create or replace function calculate_student_progress(
  p_student_email text,
  p_course_id uuid
) returns jsonb language plpgsql as $$
declare
  total_lessons integer;
  completed_lessons integer;
  total_assignments integer;
  completed_assignments integer;
  avg_grade numeric;
  total_time_spent integer;
  result jsonb;
begin
  -- Count total lessons in course
  select count(*) into total_lessons
  from course_lessons cl
  join course_modules cm on cl.module_id = cm.id
  where cm.course_id = p_course_id and cl.is_published = true;
  
  -- Count completed lessons
  select count(*) into completed_lessons
  from student_progress sp
  where sp.student_email = p_student_email 
    and sp.course_id = p_course_id 
    and sp.status = 'completed';
  
  -- Count total assignments
  select count(*) into total_assignments
  from assignments a
  where a.course_id = p_course_id;
  
  -- Count completed assignments
  select count(*) into completed_assignments
  from student_grades sg
  where sg.student_email = p_student_email 
    and sg.course_id = p_course_id 
    and sg.assignment_id is not null;
  
  -- Calculate average grade
  select coalesce(avg(grade_percentage), 0) into avg_grade
  from student_grades sg
  where sg.student_email = p_student_email 
    and sg.course_id = p_course_id;
  
  -- Calculate total time spent
  select coalesce(sum(time_spent_seconds), 0) into total_time_spent
  from student_progress sp
  where sp.student_email = p_student_email 
    and sp.course_id = p_course_id;
  
  result := jsonb_build_object(
    'total_lessons', total_lessons,
    'completed_lessons', completed_lessons,
    'progress_percentage', case when total_lessons > 0 then 
      round((completed_lessons::numeric / total_lessons::numeric) * 100) else 0 end,
    'total_assignments', total_assignments,
    'completed_assignments', completed_assignments,
    'average_grade', round(avg_grade, 1),
    'total_time_spent_hours', round(total_time_spent::numeric / 3600, 1),
    'last_activity', (
      select max(created_at) 
      from student_activities sa 
      where sa.student_email = p_student_email and sa.course_id = p_course_id
    )
  );
  
  return result;
end;
$$;

-- Function to get student engagement metrics
create or replace function get_student_engagement(
  p_student_email text,
  p_course_id uuid,
  p_days_back integer default 30
) returns jsonb language plpgsql as $$
declare
  login_frequency numeric;
  avg_session_duration numeric;
  participation_score numeric;
  forum_posts integer;
  live_sessions_attended integer;
  result jsonb;
begin
  -- Calculate login frequency (days per week)
  select count(distinct date(created_at)) / (p_days_back::numeric / 7) into login_frequency
  from student_activities sa
  where sa.student_email = p_student_email 
    and sa.course_id = p_course_id 
    and sa.activity_type = 'login'
    and sa.created_at >= now() - interval '1 day' * p_days_back;
  
  -- Calculate average session duration
  select coalesce(avg(total_session_time_seconds), 0) / 60 into avg_session_duration
  from student_engagement se
  where se.student_email = p_student_email 
    and se.course_id = p_course_id 
    and se.date >= current_date - p_days_back;
  
  -- Calculate participation score
  select coalesce(avg(participation_score), 0) into participation_score
  from student_engagement se
  where se.student_email = p_student_email 
    and se.course_id = p_course_id 
    and se.date >= current_date - p_days_back;
  
  -- Count forum posts
  select count(*) into forum_posts
  from student_activities sa
  where sa.student_email = p_student_email 
    and sa.course_id = p_course_id 
    and sa.activity_type = 'forum_post'
    and sa.created_at >= now() - interval '1 day' * p_days_back;
  
  -- Count live sessions attended
  select count(*) into live_sessions_attended
  from student_activities sa
  where sa.student_email = p_student_email 
    and sa.course_id = p_course_id 
    and sa.activity_type = 'live_session_attended'
    and sa.created_at >= now() - interval '1 day' * p_days_back;
  
  result := jsonb_build_object(
    'login_frequency', round(login_frequency, 1),
    'avg_session_duration_minutes', round(avg_session_duration, 1),
    'participation_score', round(participation_score, 1),
    'forum_posts', forum_posts,
    'live_sessions_attended', live_sessions_attended
  );
  
  return result;
end;
$$;

-- ===== Supabase Storage (buckets + policies) =====

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('assignments-resources', 'assignments-resources', false),
  ('student-submissions', 'student-submissions', false),
  ('live-resources', 'live-resources', false)
on conflict (id) do nothing;

-- Avatars: public read; owners can write/update/delete under their own folder `${auth.uid()}/...`
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid() is not null and name like auth.uid()::text || '/%'
  );

-- ===== Forum RLS Policies =====

-- Enable RLS on forum tables
alter table forum_categories enable row level security;
alter table forum_topics enable row level security;
alter table forum_replies enable row level security;
alter table forum_votes enable row level security;
alter table forum_subscriptions enable row level security;
alter table forum_tags enable row level security;
alter table forum_topic_tags enable row level security;

-- Forum categories: everyone can read, teachers can manage
create policy forum_categories_select on forum_categories
  for select using (true);

create policy forum_categories_insert on forum_categories
  for insert with check (
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_categories_update on forum_categories
  for update using (
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_categories_delete on forum_categories
  for delete using (
    exists(select 1 from teachers where email = auth.email())
  );

-- Forum topics: everyone can read, authors can edit/delete, teachers can moderate
create policy forum_topics_select on forum_topics
  for select using (true);

create policy forum_topics_insert on forum_topics
  for insert with check (
    auth.email() is not null and (
      exists(select 1 from teachers where email = auth.email()) or
      exists(select 1 from students where email = auth.email())
    )
  );

create policy forum_topics_update on forum_topics
  for update using (
    author_email = auth.email() or
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_topics_delete on forum_topics
  for delete using (
    author_email = auth.email() or
    exists(select 1 from teachers where email = auth.email())
  );

-- Forum replies: everyone can read, authors can edit/delete, teachers can moderate
create policy forum_replies_select on forum_replies
  for select using (true);

create policy forum_replies_insert on forum_replies
  for insert with check (
    auth.email() is not null and (
      exists(select 1 from teachers where email = auth.email()) or
      exists(select 1 from students where email = auth.email())
    )
  );

create policy forum_replies_update on forum_replies
  for update using (
    author_email = auth.email() or
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_replies_delete on forum_replies
  for delete using (
    author_email = auth.email() or
    exists(select 1 from teachers where email = auth.email())
  );

-- Forum votes: users can vote on their own votes
create policy forum_votes_select on forum_votes
  for select using (true);

create policy forum_votes_insert on forum_votes
  for insert with check (
    auth.email() is not null and voter_email = auth.email()
  );

create policy forum_votes_update on forum_votes
  for update using (
    auth.email() is not null and voter_email = auth.email()
  );

create policy forum_votes_delete on forum_votes
  for delete using (
    auth.email() is not null and voter_email = auth.email()
  );

-- Forum subscriptions: users can manage their own subscriptions
create policy forum_subscriptions_select on forum_subscriptions
  for select using (
    auth.email() is not null and user_email = auth.email()
  );

create policy forum_subscriptions_insert on forum_subscriptions
  for insert with check (
    auth.email() is not null and user_email = auth.email()
  );

create policy forum_subscriptions_delete on forum_subscriptions
  for delete using (
    auth.email() is not null and user_email = auth.email()
  );

-- Forum tags: everyone can read, teachers can manage
create policy forum_tags_select on forum_tags
  for select using (true);

create policy forum_tags_insert on forum_tags
  for insert with check (
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_tags_update on forum_tags
  for update using (
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_tags_delete on forum_tags
  for delete using (
    exists(select 1 from teachers where email = auth.email())
  );

-- Forum topic tags: everyone can read, teachers can manage
create policy forum_topic_tags_select on forum_topic_tags
  for select using (true);

create policy forum_topic_tags_insert on forum_topic_tags
  for insert with check (
    exists(select 1 from teachers where email = auth.email())
  );

create policy forum_topic_tags_delete on forum_topic_tags
  for delete using (
    exists(select 1 from teachers where email = auth.email())
  );

-- ===== Sample Forum Data =====

-- Insert sample forum categories
insert into forum_categories (name, description, color, icon, position, is_active) values
  ('General Discussion', 'General topics and discussions', '#3B82F6', 'message-circle', 1, true),
  ('Course Help', 'Questions and help related to specific courses', '#10B981', 'book-open', 2, true),
  ('Study Groups', 'Find study partners and form study groups', '#F59E0B', 'users', 3, true),
  ('Technical Support', 'Technical issues and platform help', '#EF4444', 'settings', 4, true),
  ('Announcements', 'Important announcements and updates', '#8B5CF6', 'bell', 5, true);

-- Insert sample forum tags
insert into forum_tags (name, color) values
  ('question', '#3B82F6'),
  ('help', '#10B981'),
  ('discussion', '#F59E0B'),
  ('announcement', '#EF4444'),
  ('study-group', '#8B5CF6'),
  ('technical', '#6B7280');

-- Insert sample forum topics
insert into forum_topics (category_id, course_id, title, content, author_email, author_role, is_pinned, is_announcement, view_count, reply_count, created_at) 
select 
  fc.id as category_id,
  c.id as course_id,
  'Welcome to our Learning Community!' as title,
  'Hello everyone! Welcome to our discussion forum. This is a place where we can share ideas, ask questions, and support each other in our learning journey. Feel free to start discussions, ask for help, or share your experiences. Let''s make this a vibrant and supportive community!' as content,
  'teacher@school.edu' as author_email,
  'teacher' as author_role,
  true as is_pinned,
  true as is_announcement,
  45 as view_count,
  8 as reply_count,
  now() - interval '2 days' as created_at
from forum_categories fc, courses c 
where fc.name = 'Announcements' and c.title = 'Introduction to Computer Science'
limit 1;

insert into forum_topics (category_id, course_id, title, content, author_email, author_role, is_pinned, is_announcement, view_count, reply_count, created_at) 
select 
  fc.id as category_id,
  c.id as course_id,
  'Need help with Assignment 3' as title,
  'I''m having trouble understanding the requirements for Assignment 3 in the Data Structures module. Can anyone help clarify the expectations? Specifically, I''m confused about the implementation of the binary search tree. Any guidance would be greatly appreciated!' as content,
  'student1@test.com' as author_email,
  'student' as author_role,
  false as is_pinned,
  false as is_announcement,
  23 as view_count,
  5 as reply_count,
  now() - interval '1 day' as created_at
from forum_categories fc, courses c 
where fc.name = 'Course Help' and c.title = 'Introduction to Computer Science'
limit 1;

insert into forum_topics (category_id, course_id, title, content, author_email, author_role, is_pinned, is_announcement, view_count, reply_count, created_at) 
select 
  fc.id as category_id,
  null as course_id,
  'Study Group for Math Students' as title,
  'Looking to form a study group for students taking advanced mathematics courses. We can meet weekly to discuss problems, share resources, and help each other prepare for exams. Anyone interested in joining?' as content,
  'student2@test.com' as author_email,
  'student' as author_role,
  false as is_pinned,
  false as is_announcement,
  18 as view_count,
  3 as reply_count,
  now() - interval '12 hours' as created_at
from forum_categories fc 
where fc.name = 'Study Groups'
limit 1;

-- Insert sample forum replies
insert into forum_replies (topic_id, content, author_email, author_role, upvotes, downvotes, created_at)
select 
  ft.id as topic_id,
  'Welcome! I''m excited to be part of this community. Looking forward to learning together and sharing knowledge.' as content,
  'student1@test.com' as author_email,
  'student' as author_role,
  3 as upvotes,
  0 as downvotes,
  now() - interval '2 days' + interval '1 hour' as created_at
from forum_topics ft 
where ft.title = 'Welcome to our Learning Community!'
limit 1;

insert into forum_replies (topic_id, content, author_email, author_role, upvotes, downvotes, created_at)
select 
  ft.id as topic_id,
  'I can help you with Assignment 3! The binary search tree implementation requires you to maintain the BST property at each insertion. Have you tried implementing the basic structure first?' as content,
  'teacher@school.edu' as author_email,
  'teacher' as author_role,
  5 as upvotes,
  0 as downvotes,
  now() - interval '1 day' + interval '30 minutes' as created_at
from forum_topics ft 
where ft.title = 'Need help with Assignment 3'
limit 1;

insert into forum_replies (topic_id, content, author_email, author_role, upvotes, downvotes, created_at)
select 
  ft.id as topic_id,
  'I''m interested in joining the math study group! What days work best for everyone?' as content,
  'student3@test.com' as author_email,
  'student' as author_role,
  2 as upvotes,
  0 as downvotes,
  now() - interval '12 hours' + interval '15 minutes' as created_at
from forum_topics ft 
where ft.title = 'Study Group for Math Students'
limit 1;