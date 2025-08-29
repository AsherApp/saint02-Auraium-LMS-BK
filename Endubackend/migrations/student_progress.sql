-- Student Progress and Activity Tracking Tables

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

-- Track student attendance in live sessions
create table if not exists student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on delete cascade,
  live_session_id uuid not null references live_sessions(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds integer, -- calculated duration
  participation_score integer, -- optional participation rating
  metadata jsonb default '{}' -- additional attendance data
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
create index if not exists idx_student_attendance_student on student_attendance(student_email);
create index if not exists idx_student_engagement_student_course on student_engagement(student_email, course_id);
create index if not exists idx_student_engagement_date on student_engagement(date);
create index if not exists idx_course_modules_course on course_modules(course_id);
create index if not exists idx_course_lessons_module on course_lessons(module_id);

-- Enable RLS
alter table student_progress enable row level security;
alter table student_activities enable row level security;
alter table student_grades enable row level security;
alter table student_attendance enable row level security;
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

-- Similar policies for other tables...
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
