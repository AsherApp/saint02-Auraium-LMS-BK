-- =====================================================
-- MIGRATION 03: Add user_email to live_class_participants
-- =====================================================
-- Adds email column while keeping user_id for safety

-- Step 1: Add user_email column (making it nullable initially)
ALTER TABLE live_class_participants 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Step 2: Populate user_email from user_id
-- If user_id exists, look up email from user_profiles
UPDATE live_class_participants lcp
SET user_email = up.email
FROM user_profiles up
WHERE lcp.user_id = up.id
AND lcp.user_email IS NULL
AND lcp.user_id IS NOT NULL;

-- Step 3: For records with email but no user_id, use the existing email
UPDATE live_class_participants
SET user_email = email
WHERE user_email IS NULL
AND email IS NOT NULL;

-- Step 4: Add index
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_email ON live_class_participants(user_email);

-- Verify migration
SELECT 
  COUNT(*) AS total_participants,
  COUNT(user_id) AS has_user_id,
  COUNT(user_email) AS has_user_email,
  COUNT(email) AS has_email_column,
  COUNT(*) FILTER (WHERE user_email IS NULL) AS missing_user_email
FROM live_class_participants;

-- Show sample data
SELECT id, user_id, email, user_email, user_type, live_class_id
FROM live_class_participants 
LIMIT 10;

