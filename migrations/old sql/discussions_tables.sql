-- Discussions and Forum Tables

-- Discussions table
create table if not exists discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  course_id uuid not null references courses(id) on delete cascade,
  created_by text not null,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Discussion posts table
create table if not exists discussion_posts (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references discussions(id) on delete cascade,
  content text not null,
  created_by text not null,
  parent_post_id uuid references discussion_posts(id) on delete cascade,
  is_edited boolean not null default false,
  edited_at timestamptz,
  edited_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Student progress tables
create table if not exists student_progress (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  module_id uuid references modules(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  progress_type text not null, -- lesson_completed, quiz_passed, assignment_submitted, discussion_participated, poll_responded
  status text not null default 'in_progress', -- in_progress, completed, failed
  score numeric(5,2),
  time_spent_seconds integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_email, course_id, lesson_id, progress_type)
);

-- Student activities table
create table if not exists student_activities (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  activity_type text not null, -- lesson_completed, quiz_completed, assignment_submitted, discussion_posted, poll_responded
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Course completions table
create table if not exists course_completions (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  completion_percentage numeric(5,2) not null default 0,
  total_lessons integer not null default 0,
  completed_lessons integer not null default 0,
  total_assignments integer not null default 0,
  completed_assignments integer not null default 0,
  total_quizzes integer not null default 0,
  passed_quizzes integer not null default 0,
  average_grade numeric(5,2),
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_email, course_id)
);

-- Quiz attempts table
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null, -- references quizzes table (to be created)
  student_email text not null references students(email) on delete cascade,
  attempt_number integer not null default 1,
  answers jsonb default '{}',
  score numeric(5,2),
  passed boolean not null default false,
  time_taken_seconds integer default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Poll responses table
create table if not exists poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null, -- references polls table (to be created)
  student_email text not null references students(email) on delete cascade,
  selected_options text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(poll_id, student_email)
);

-- Enable RLS on all tables
alter table discussions enable row level security;
alter table discussion_posts enable row level security;
alter table student_progress enable row level security;
alter table student_activities enable row level security;
alter table course_completions enable row level security;
alter table quiz_attempts enable row level security;
alter table poll_responses enable row level security;

-- RLS Policies for discussions
create policy discussions_teacher_rw on discussions for all using (
  exists(select 1 from courses c where c.id = discussions.course_id and c.teacher_email = auth.email())
) with check (
  exists(select 1 from courses c where c.id = discussions.course_id and c.teacher_email = auth.email())
);

create policy discussions_student_read on discussions for select using (
  exists(select 1 from enrollments e where e.course_id = discussions.course_id and e.student_email = auth.email())
);

create policy discussions_student_create on discussions for insert with check (
  exists(select 1 from enrollments e where e.course_id = discussions.course_id and e.student_email = auth.email())
);

-- RLS Policies for discussion_posts
create policy discussion_posts_teacher_rw on discussion_posts for all using (
  exists(select 1 from discussions d join courses c on c.id = d.course_id where d.id = discussion_posts.discussion_id and c.teacher_email = auth.email())
) with check (
  exists(select 1 from discussions d join courses c on c.id = d.course_id where d.id = discussion_posts.discussion_id and c.teacher_email = auth.email())
);

create policy discussion_posts_student_read on discussion_posts for select using (
  exists(select 1 from discussions d join enrollments e on e.course_id = d.course_id where d.id = discussion_posts.discussion_id and e.student_email = auth.email())
);

create policy discussion_posts_student_create on discussion_posts for insert with check (
  exists(select 1 from discussions d join enrollments e on e.course_id = d.course_id where d.id = discussion_posts.discussion_id and e.student_email = auth.email())
);

-- RLS Policies for student_progress
create policy student_progress_student_rw on student_progress for all using (
  student_email = auth.email()
) with check (
  student_email = auth.email()
);

create policy student_progress_teacher_read on student_progress for select using (
  exists(select 1 from courses c where c.id = student_progress.course_id and c.teacher_email = auth.email())
);

-- RLS Policies for student_activities
create policy student_activities_student_read on student_activities for select using (
  student_email = auth.email()
);

create policy student_activities_teacher_read on student_activities for select using (
  exists(select 1 from courses c where c.id = student_activities.course_id and c.teacher_email = auth.email())
);

-- RLS Policies for course_completions
create policy course_completions_student_read on course_completions for select using (
  student_email = auth.email()
);

create policy course_completions_teacher_read on course_completions for select using (
  exists(select 1 from courses c where c.id = course_completions.course_id and c.teacher_email = auth.email())
);

-- RLS Policies for quiz_attempts
create policy quiz_attempts_student_rw on quiz_attempts for all using (
  student_email = auth.email()
) with check (
  student_email = auth.email()
);

create policy quiz_attempts_teacher_read on quiz_attempts for select using (
  exists(select 1 from quizzes q join courses c on c.id = q.course_id where q.id = quiz_attempts.quiz_id and c.teacher_email = auth.email())
);

-- RLS Policies for poll_responses
create policy poll_responses_student_rw on poll_responses for all using (
  student_email = auth.email()
) with check (
  student_email = auth.email()
);

create policy poll_responses_teacher_read on poll_responses for select using (
  exists(select 1 from polls p join courses c on c.id = p.course_id where p.id = poll_responses.poll_id and c.teacher_email = auth.email())
);

-- Create indexes for better performance
create index if not exists idx_discussions_course_id on discussions(course_id);
create index if not exists idx_discussions_created_by on discussions(created_by);
create index if not exists idx_discussion_posts_discussion_id on discussion_posts(discussion_id);
create index if not exists idx_discussion_posts_created_by on discussion_posts(created_by);
create index if not exists idx_student_progress_student_email on student_progress(student_email);
create index if not exists idx_student_progress_course_id on student_progress(course_id);
create index if not exists idx_student_activities_student_email on student_activities(student_email);
create index if not exists idx_student_activities_course_id on student_activities(course_id);
create index if not exists idx_course_completions_student_email on course_completions(student_email);
create index if not exists idx_course_completions_course_id on course_completions(course_id);
create index if not exists idx_quiz_attempts_student_email on quiz_attempts(student_email);
create index if not exists idx_quiz_attempts_quiz_id on quiz_attempts(quiz_id);
create index if not exists idx_poll_responses_student_email on poll_responses(student_email);
create index if not exists idx_poll_responses_poll_id on poll_responses(poll_id);
