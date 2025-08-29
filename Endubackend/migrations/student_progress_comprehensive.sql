-- Comprehensive Student Progress Tracking System
-- This migration fixes all the issues with student progress tracking

-- 1. Create comprehensive notes table
CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_shared_with_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create comprehensive quiz system
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL REFERENCES teachers(email),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  passed BOOLEAN,
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quiz_id, student_email, attempt_number)
);

-- 3. Create comprehensive poll system
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  allow_multiple_votes BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL REFERENCES teachers(email),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  selected_options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, student_email)
);

-- 4. Create comprehensive discussion system
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  allow_student_posts BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL REFERENCES teachers(email),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('teacher', 'student')),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  parent_post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create comprehensive student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  progress_type TEXT NOT NULL CHECK (progress_type IN ('lesson_completed', 'quiz_passed', 'assignment_submitted', 'discussion_participated', 'poll_responded')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  score INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, course_id, lesson_id, progress_type)
);

-- 6. Create comprehensive student activities log
CREATE TABLE IF NOT EXISTS student_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'lesson_started', 'lesson_completed', 'quiz_started', 'quiz_completed', 
    'assignment_started', 'assignment_submitted', 'discussion_posted', 'poll_responded',
    'note_created', 'note_updated', 'live_session_joined', 'live_session_left'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create comprehensive course completion tracking
CREATE TABLE IF NOT EXISTS course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_assignments INTEGER NOT NULL DEFAULT 0,
  completed_assignments INTEGER NOT NULL DEFAULT 0,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  passed_quizzes INTEGER NOT NULL DEFAULT 0,
  average_grade DECIMAL(5,2),
  last_activity_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, course_id)
);

-- 8. Create comprehensive module completion tracking
CREATE TABLE IF NOT EXISTS module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_assignments INTEGER NOT NULL DEFAULT 0,
  completed_assignments INTEGER NOT NULL DEFAULT 0,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  passed_quizzes INTEGER NOT NULL DEFAULT 0,
  average_grade DECIMAL(5,2),
  last_activity_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, course_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX idx_student_notes_student_email ON student_notes(student_email);
CREATE INDEX idx_student_notes_course_id ON student_notes(course_id);
CREATE INDEX idx_student_notes_lesson_id ON student_notes(lesson_id);

CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_email ON quiz_attempts(student_email);

CREATE INDEX idx_polls_course_id ON polls(course_id);
CREATE INDEX idx_polls_lesson_id ON polls(lesson_id);
CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_student_email ON poll_responses(student_email);

CREATE INDEX idx_discussions_course_id ON discussions(course_id);
CREATE INDEX idx_discussions_lesson_id ON discussions(lesson_id);
CREATE INDEX idx_discussion_posts_discussion_id ON discussion_posts(discussion_id);
CREATE INDEX idx_discussion_posts_author_email ON discussion_posts(author_email);

CREATE INDEX idx_student_progress_student_email ON student_progress(student_email);
CREATE INDEX idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX idx_student_progress_lesson_id ON student_progress(lesson_id);

CREATE INDEX idx_student_activities_student_email ON student_activities(student_email);
CREATE INDEX idx_student_activities_course_id ON student_activities(course_id);
CREATE INDEX idx_student_activities_created_at ON student_activities(created_at);

CREATE INDEX idx_course_completions_student_email ON course_completions(student_email);
CREATE INDEX idx_course_completions_course_id ON course_completions(course_id);

CREATE INDEX idx_module_completions_student_email ON module_completions(student_email);
CREATE INDEX idx_module_completions_course_id ON module_completions(course_id);
CREATE INDEX idx_module_completions_module_id ON module_completions(module_id);

-- Create RLS policies
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

-- Student notes policies
CREATE POLICY "Students can view their own notes" ON student_notes
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own notes" ON student_notes
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Students can update their own notes" ON student_notes
  FOR UPDATE USING (student_email = current_user);

CREATE POLICY "Students can delete their own notes" ON student_notes
  FOR DELETE USING (student_email = current_user);

CREATE POLICY "Teachers can view student notes if shared" ON student_notes
  FOR SELECT USING (
    is_shared_with_teacher = true AND
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = student_notes.course_id
      AND c.teacher_email = current_user
    )
  );

-- Quiz policies
CREATE POLICY "Teachers can manage their course quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = quizzes.course_id
      AND c.teacher_email = current_user
    )
  );

CREATE POLICY "Students can view quizzes for enrolled courses" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = quizzes.course_id
      AND e.student_email = current_user
    )
  );

-- Quiz attempts policies
CREATE POLICY "Students can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view quiz attempts for their courses" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN courses c ON c.id = q.course_id
      WHERE q.id = quiz_attempts.quiz_id
      AND c.teacher_email = current_user
    )
  );

-- Poll policies
CREATE POLICY "Teachers can manage their course polls" ON polls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = polls.course_id
      AND c.teacher_email = current_user
    )
  );

CREATE POLICY "Students can view polls for enrolled courses" ON polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = polls.course_id
      AND e.student_email = current_user
    )
  );

-- Poll responses policies
CREATE POLICY "Students can view their own poll responses" ON poll_responses
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own poll responses" ON poll_responses
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view poll responses for their courses" ON poll_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN courses c ON c.id = p.course_id
      WHERE p.id = poll_responses.poll_id
      AND c.teacher_email = current_user
    )
  );

-- Discussion policies
CREATE POLICY "Teachers can manage their course discussions" ON discussions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = discussions.course_id
      AND c.teacher_email = current_user
    )
  );

CREATE POLICY "Students can view discussions for enrolled courses" ON discussions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = discussions.course_id
      AND e.student_email = current_user
    )
  );

-- Discussion posts policies
CREATE POLICY "Students can view approved discussion posts" ON discussion_posts
  FOR SELECT USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM discussions d
      JOIN enrollments e ON e.course_id = d.course_id
      WHERE d.id = discussion_posts.discussion_id
      AND e.student_email = current_user
    )
  );

CREATE POLICY "Students can create discussion posts if allowed" ON discussion_posts
  FOR INSERT WITH CHECK (
    author_email = current_user AND
    author_role = 'student' AND
    EXISTS (
      SELECT 1 FROM discussions d
      JOIN enrollments e ON e.course_id = d.course_id
      WHERE d.id = discussion_posts.discussion_id
      AND e.student_email = current_user
      AND d.allow_student_posts = true
    )
  );

CREATE POLICY "Teachers can view all discussion posts for their courses" ON discussion_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM discussions d
      JOIN courses c ON c.id = d.course_id
      WHERE d.id = discussion_posts.discussion_id
      AND c.teacher_email = current_user
    )
  );

-- Student progress policies
CREATE POLICY "Students can view their own progress" ON student_progress
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own progress" ON student_progress
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view student progress for their courses" ON student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = student_progress.course_id
      AND c.teacher_email = current_user
    )
  );

-- Student activities policies
CREATE POLICY "Students can view their own activities" ON student_activities
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own activities" ON student_activities
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view student activities for their courses" ON student_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = student_activities.course_id
      AND c.teacher_email = current_user
    )
  );

-- Course completions policies
CREATE POLICY "Students can view their own course completions" ON course_completions
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own course completions" ON course_completions
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view course completions for their courses" ON course_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_completions.course_id
      AND c.teacher_email = current_user
    )
  );

-- Module completions policies
CREATE POLICY "Students can view their own module completions" ON module_completions
  FOR SELECT USING (student_email = current_user);

CREATE POLICY "Students can create their own module completions" ON module_completions
  FOR INSERT WITH CHECK (student_email = current_user);

CREATE POLICY "Teachers can view module completions for their courses" ON module_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = module_completions.course_id
      AND c.teacher_email = current_user
    )
  );

-- Create functions for automatic progress tracking
CREATE OR REPLACE FUNCTION update_course_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update course completion when student progress changes
  INSERT INTO course_completions (
    student_email,
    course_id,
    completion_percentage,
    total_lessons,
    completed_lessons,
    total_assignments,
    completed_assignments,
    total_quizzes,
    passed_quizzes,
    last_activity_at
  )
  SELECT 
    NEW.student_email,
    NEW.course_id,
    CASE 
      WHEN total_lessons > 0 THEN ROUND((completed_lessons::DECIMAL / total_lessons) * 100)
      ELSE 0
    END,
    total_lessons,
    completed_lessons,
    total_assignments,
    completed_assignments,
    total_quizzes,
    passed_quizzes,
    NOW()
  FROM (
    SELECT 
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END) as completed_lessons,
      COUNT(DISTINCT a.id) as total_assignments,
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' AND sp.progress_type = 'assignment_submitted' THEN a.id END) as completed_assignments,
      COUNT(DISTINCT q.id) as total_quizzes,
      COUNT(DISTINCT CASE WHEN qa.passed = true THEN q.id END) as passed_quizzes
    FROM courses c
    LEFT JOIN modules m ON m.course_id = c.id
    LEFT JOIN lessons l ON l.module_id = m.id
    LEFT JOIN assignments a ON a.course_id = c.id
    LEFT JOIN quizzes q ON q.course_id = c.id
    LEFT JOIN student_progress sp ON sp.student_email = NEW.student_email AND sp.course_id = c.id
    LEFT JOIN quiz_attempts qa ON qa.student_email = NEW.student_email AND qa.quiz_id = q.id
    WHERE c.id = NEW.course_id
  ) stats
  ON CONFLICT (student_email, course_id) DO UPDATE SET
    completion_percentage = EXCLUDED.completion_percentage,
    total_lessons = EXCLUDED.total_lessons,
    completed_lessons = EXCLUDED.completed_lessons,
    total_assignments = EXCLUDED.total_assignments,
    completed_assignments = EXCLUDED.completed_assignments,
    total_quizzes = EXCLUDED.total_quizzes,
    passed_quizzes = EXCLUDED.passed_quizzes,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_completion
  AFTER INSERT OR UPDATE ON student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_completion();

-- Create function to update module completion
CREATE OR REPLACE FUNCTION update_module_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update module completion when student progress changes
  INSERT INTO module_completions (
    student_email,
    course_id,
    module_id,
    completion_percentage,
    total_lessons,
    completed_lessons,
    total_assignments,
    completed_assignments,
    total_quizzes,
    passed_quizzes,
    last_activity_at
  )
  SELECT 
    NEW.student_email,
    NEW.course_id,
    NEW.module_id,
    CASE 
      WHEN total_lessons > 0 THEN ROUND((completed_lessons::DECIMAL / total_lessons) * 100)
      ELSE 0
    END,
    total_lessons,
    completed_lessons,
    total_assignments,
    completed_assignments,
    total_quizzes,
    passed_quizzes,
    NOW()
  FROM (
    SELECT 
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END) as completed_lessons,
      COUNT(DISTINCT a.id) as total_assignments,
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' AND sp.progress_type = 'assignment_submitted' THEN a.id END) as completed_assignments,
      COUNT(DISTINCT q.id) as total_quizzes,
      COUNT(DISTINCT CASE WHEN qa.passed = true THEN q.id END) as passed_quizzes
    FROM modules m
    LEFT JOIN lessons l ON l.module_id = m.id
    LEFT JOIN assignments a ON a.course_id = m.course_id AND a.module_id = m.id
    LEFT JOIN quizzes q ON q.course_id = m.course_id AND q.module_id = m.id
    LEFT JOIN student_progress sp ON sp.student_email = NEW.student_email AND sp.module_id = m.id
    LEFT JOIN quiz_attempts qa ON qa.student_email = NEW.student_email AND qa.quiz_id = q.id
    WHERE m.id = NEW.module_id
  ) stats
  ON CONFLICT (student_email, course_id, module_id) DO UPDATE SET
    completion_percentage = EXCLUDED.completion_percentage,
    total_lessons = EXCLUDED.total_lessons,
    completed_lessons = EXCLUDED.completed_lessons,
    total_assignments = EXCLUDED.total_assignments,
    completed_assignments = EXCLUDED.completed_assignments,
    total_quizzes = EXCLUDED.total_quizzes,
    passed_quizzes = EXCLUDED.passed_quizzes,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_completion
  AFTER INSERT OR UPDATE ON student_progress
  FOR EACH ROW
  WHEN (NEW.module_id IS NOT NULL)
  EXECUTE FUNCTION update_module_completion();

-- Create function to log student activities
CREATE OR REPLACE FUNCTION log_student_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log activity when student progress changes
  INSERT INTO student_activities (
    student_email,
    course_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.student_email,
    NEW.course_id,
    CASE NEW.progress_type
      WHEN 'lesson_completed' THEN 'lesson_completed'
      WHEN 'quiz_passed' THEN 'quiz_completed'
      WHEN 'assignment_submitted' THEN 'assignment_submitted'
      WHEN 'discussion_participated' THEN 'discussion_posted'
      WHEN 'poll_responded' THEN 'poll_responded'
      ELSE 'lesson_completed'
    END,
    CASE NEW.progress_type
      WHEN 'lesson_completed' THEN 'Completed lesson'
      WHEN 'quiz_passed' THEN 'Completed quiz'
      WHEN 'assignment_submitted' THEN 'Submitted assignment'
      WHEN 'discussion_participated' THEN 'Participated in discussion'
      WHEN 'poll_responded' THEN 'Responded to poll'
      ELSE 'Completed activity'
    END,
    jsonb_build_object(
      'progress_type', NEW.progress_type,
      'lesson_id', NEW.lesson_id,
      'module_id', NEW.module_id,
      'status', NEW.status,
      'score', NEW.score,
      'time_spent_seconds', NEW.time_spent_seconds
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_student_activity
  AFTER INSERT ON student_progress
  FOR EACH ROW
  EXECUTE FUNCTION log_student_activity();

-- Insert sample data for testing
INSERT INTO quizzes (
  course_id,
  title,
  description,
  questions,
  time_limit_minutes,
  passing_score,
  max_attempts,
  created_by
) VALUES (
  '56881257-6dd1-420a-a30e-d553045a3f36',
  'Sample Quiz',
  'Test your knowledge with this sample quiz',
  '[
    {
      "id": "1",
      "type": "multiple_choice",
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": 2,
      "points": 10
    },
    {
      "id": "2", 
      "type": "true_false",
      "question": "The Earth is round.",
      "correct_answer": true,
      "points": 5
    }
  ]',
  30,
  70,
  2,
  'lxbrw23@gmail.com'
);

INSERT INTO polls (
  course_id,
  question,
  options,
  allow_multiple_votes,
  created_by
) VALUES (
  '56881257-6dd1-420a-a30e-d553045a3f36',
  'How did you find this lesson?',
  '["Very helpful", "Somewhat helpful", "Not helpful", "Need more practice"]',
  false,
  'lxbrw23@gmail.com'
);

INSERT INTO discussions (
  course_id,
  title,
  description,
  allow_student_posts,
  require_approval,
  created_by
) VALUES (
  '56881257-6dd1-420a-a30e-d553045a3f36',
  'General Discussion',
  'Discuss any questions or topics related to this course',
  true,
  false,
  'lxbrw23@gmail.com'
);
