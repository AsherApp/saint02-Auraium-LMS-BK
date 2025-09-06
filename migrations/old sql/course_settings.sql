-- Course settings: status, visibility, enrollment policy

alter table courses
  add column if not exists status text not null default 'draft' check (status in ('draft','published','archived')),
  add column if not exists visibility text not null default 'private' check (visibility in ('private','unlisted','public')),
  add column if not exists enrollment_policy text not null default 'invite_only' check (enrollment_policy in ('invite_only','request','open')),
  add column if not exists published_at timestamptz;

create index if not exists idx_courses_status on courses(status);
create index if not exists idx_courses_visibility on courses(visibility);

-- Pending invites vs active enrollments combined view (read-only)
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

