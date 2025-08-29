-- Core tables (Supabase Postgres). Enable RLS and add policies appropriately.

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  password_hash text,
  subscription_status text not null default 'free',
  max_students_allowed int not null default 5,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  student_code text unique,
  password_hash text,
  status text not null default 'active', -- active | suspended | invited
  created_at timestamptz not null default now()
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
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'scheduled', -- scheduled | live | ended
  host_email text not null references teachers(email) on delete cascade
);

create table if not exists live_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  email text not null,
  joined_at timestamptz not null default now()
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
  body text not null,
  at timestamptz not null default now(),
  read boolean not null default false
);

-- TODO: RLS policies and storage buckets configuration.

