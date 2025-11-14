# Database Migration Guide: UUID to Email Migration

## Overview
This migration standardizes the live class system to use email-based identification (matching 90% of your codebase) instead of UUIDs.

## ⚠️ IMPORTANT: Run Migrations in Order

**DO NOT skip steps or run out of order!**

---

## Migration Steps

### Step 1: Create recording_bookmarks Table ✅
**File:** `01-create-recording-bookmarks.sql`

**What it does:**
- Creates new `recording_bookmarks` table
- Uses `user_email` (not UUID)
- Adds indexes and RLS policies

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `01-create-recording-bookmarks.sql`
3. Click "Run"
4. Verify output shows "recording_bookmarks table created successfully"

**Risk:** ✅ SAFE - New table, no existing data

---

### Step 2: Add teacher_email to live_classes
**File:** `02-add-email-columns-to-live-classes.sql`

**What it does:**
- Adds `teacher_email` column to `live_classes`
- Populates it from existing `teacher_id` (UUID)
- Keeps `teacher_id` for safety (doesn't delete it)

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `02-add-email-columns-to-live-classes.sql`
3. Click "Run"
4. Check the verification output to ensure all records have emails

**Risk:** ✅ SAFE - Adds new column, keeps old one

---

### Step 3: Add user_email to live_class_participants
**File:** `03-add-email-to-participants.sql`

**What it does:**
- Adds `user_email` column to `live_class_participants`
- Populates from `user_id` (UUID) via user_profiles lookup
- Keeps `user_id` for safety

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `03-add-email-to-participants.sql`
3. Click "Run"
4. Check verification output

**Risk:** ✅ SAFE - Adds new column, keeps old one

---

### Step 4: Add student_email to live_class_attendance
**File:** `04-add-email-to-attendance.sql`

**What it does:**
- Adds `student_email` column to `live_class_attendance`
- Populates from `student_id` (UUID)
- Keeps `student_id` for safety

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `04-add-email-to-attendance.sql`
3. Click "Run"
4. Check verification output

**Risk:** ✅ SAFE - Adds new column, keeps old one

---

## After All Migrations Complete

### Test Your System
1. ✅ Check that live classes still load
2. ✅ Try creating a new live class
3. ✅ Try joining a live class
4. ✅ Check attendance tracking
5. ✅ Verify recordings work

### Once Everything Works
After confirming the email columns work correctly, you can optionally:

1. **Make email columns NOT NULL** (enforce data integrity)
2. **Drop old UUID columns** (clean up)
3. **Update foreign key constraints**

**But only do this after thoroughly testing!**

---

## Rollback Plan

If something breaks:

```sql
-- Rollback Step 4
ALTER TABLE live_class_attendance DROP COLUMN IF EXISTS student_email;

-- Rollback Step 3
ALTER TABLE live_class_participants DROP COLUMN IF EXISTS user_email;

-- Rollback Step 2
ALTER TABLE live_classes DROP COLUMN IF EXISTS teacher_email;

-- Rollback Step 1
DROP TABLE IF EXISTS recording_bookmarks CASCADE;
```

---

## Verification Queries

After each migration, run these to verify:

```sql
-- Check live_classes
SELECT COUNT(*) AS total, 
       COUNT(teacher_id) AS has_uuid,
       COUNT(teacher_email) AS has_email
FROM live_classes;

-- Check participants
SELECT COUNT(*) AS total,
       COUNT(user_id) AS has_uuid, 
       COUNT(user_email) AS has_email
FROM live_class_participants;

-- Check attendance
SELECT COUNT(*) AS total,
       COUNT(student_id) AS has_uuid,
       COUNT(student_email) AS has_email  
FROM live_class_attendance;
```

All counts should match!

---

## Support

If you encounter issues:
1. Check the verification output from each migration
2. Run the verification queries above
3. Check Supabase logs for errors
4. Use rollback plan if needed

