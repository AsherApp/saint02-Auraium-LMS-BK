-- Enable RLS and add access policies using Supabase auth.email()

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

-- Student login codes (service role only)
alter table student_login_codes enable row level security;
-- No public policies: access via backend with service role only

