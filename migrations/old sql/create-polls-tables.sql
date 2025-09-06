-- Create polls table if it doesn't exist
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, voter_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_session_id ON polls(session_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_email ON poll_votes(voter_email);

-- Enable RLS (Row Level Security)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls
CREATE POLICY IF NOT EXISTS "Users can view polls for sessions they have access to" ON polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = polls.session_id
      AND (
        ls.teacher_email = current_user
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.id = ls.course_id
          AND e.student_email = current_user
        )
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Teachers can create polls in their sessions" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = polls.session_id
      AND ls.teacher_email = current_user
    )
  );

CREATE POLICY IF NOT EXISTS "Teachers can update polls in their sessions" ON polls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      WHERE ls.id = polls.session_id
      AND ls.teacher_email = current_user
    )
  );

-- Create RLS policies for poll_options
CREATE POLICY IF NOT EXISTS "Users can view poll options for polls they have access to" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE p.id = poll_options.poll_id
      AND (
        ls.teacher_email = current_user
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.id = ls.course_id
          AND e.student_email = current_user
        )
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Teachers can create poll options for their polls" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE p.id = poll_options.poll_id
      AND ls.teacher_email = current_user
    )
  );

-- Create RLS policies for poll_votes
CREATE POLICY IF NOT EXISTS "Users can view votes for polls they have access to" ON poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE p.id = poll_votes.poll_id
      AND (
        ls.teacher_email = current_user
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.id = ls.course_id
          AND e.student_email = current_user
        )
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Users can vote on polls they have access to" ON poll_votes
  FOR INSERT WITH CHECK (
    voter_email = current_user
    AND EXISTS (
      SELECT 1 FROM polls p
      JOIN live_sessions ls ON p.session_id = ls.id
      WHERE p.id = poll_votes.poll_id
      AND (
        ls.teacher_email = current_user
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE c.id = ls.course_id
          AND e.student_email = current_user
        )
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their own votes" ON poll_votes
  FOR UPDATE USING (voter_email = current_user);

CREATE POLICY IF NOT EXISTS "Users can delete their own votes" ON poll_votes
  FOR DELETE USING (voter_email = current_user);
