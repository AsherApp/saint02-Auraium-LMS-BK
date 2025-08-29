-- Additional auth-related structures

-- Student one-time login codes (email + code)
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

-- Helper view to resolve role by email quickly
create or replace view user_roles as
  select email, 'teacher'::text as role from teachers
  union
  select email, 'student'::text as role from students;

