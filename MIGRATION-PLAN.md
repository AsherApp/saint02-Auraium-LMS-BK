# 🚀 Step-by-Step Migration Plan: UUID → Email

## ✅ Safe Migration Strategy

This plan adds email columns ALONGSIDE UUID columns, so nothing breaks during migration.

---

## PHASE 1: Database Migrations (Do This First!)

### Step 1.1: Create recording_bookmarks Table
```bash
# Open: https://supabase.com → Your Project → SQL Editor
# Copy and run: Endubackend/migrations/01-create-recording-bookmarks.sql
```

**Expected Result:**
```
✓ recording_bookmarks table created successfully
```

**What This Does:**
- Creates new table for bookmark feature
- Uses user_email (not UUID)
- Completely safe - new table, no existing data

---

### Step 1.2: Add teacher_email to live_classes
```bash
# Copy and run: Endubackend/migrations/02-add-email-columns-to-live-classes.sql
```

**Expected Result:**
```
total_classes  | has_teacher_id | has_teacher_email | missing_email
            10 |             10 |                10 |             0
```

**What This Does:**
- Adds teacher_email column
- Populates it from existing teacher_id
- KEEPS teacher_id (doesn't delete it)
- ✅ Safe - no data loss

---

### Step 1.3: Add user_email to live_class_participants  
```bash
# Copy and run: Endubackend/migrations/03-add-email-to-participants.sql
```

**Expected Result:**
```
total_participants | has_user_id | has_user_email | missing_user_email
               50 |          50 |             50 |                  0
```

**What This Does:**
- Adds user_email column
- Populates from user_id
- KEEPS user_id
- ✅ Safe - no data loss

---

### Step 1.4: Add student_email to live_class_attendance
```bash
# Copy and run: Endubackend/migrations/04-add-email-to-attendance.sql
```

**Expected Result:**
```
total_attendance_records | has_student_id | has_student_email | missing_email
                    100 |            100 |               100 |             0
```

**What This Does:**
- Adds student_email column
- Populates from student_id
- KEEPS student_id
- ✅ Safe - no data loss

---

## ⏸️ STOP HERE AND TEST

After running all 4 migrations:

1. **Check Your Tables:**
```sql
-- Should show BOTH columns now
SELECT id, teacher_id, teacher_email, title 
FROM live_classes 
LIMIT 5;

SELECT id, user_id, user_email, user_type
FROM live_class_participants
LIMIT 5;

SELECT id, student_id, student_email 
FROM live_class_attendance
LIMIT 5;
```

2. **Verify Data Migration:**
```sql
-- All should return 0 (no missing emails)
SELECT COUNT(*) FROM live_classes WHERE teacher_email IS NULL;
SELECT COUNT(*) FROM live_class_participants WHERE user_email IS NULL;
SELECT COUNT(*) FROM live_class_attendance WHERE student_email IS NULL;
```

3. **Test Your App:**
- ✅ Can you still view live classes?
- ✅ Can you create a new live class?
- ✅ Can students join?
- ✅ Does attendance work?

**If anything is broken, STOP and let me know!**

---

## PHASE 2: Update Backend Code (After DB Migrations Work)

I've started updating the backend code. These files need to be updated to use email columns:

### Files Already Updated:
✅ `src/services/liveClass.service.ts` (partially - createLiveClass now uses email)

### Files Still Need Updates:
- `src/services/participant.service.ts` - update to use user_email
- `src/services/attendance.service.ts` - update to use student_email  
- `src/server.ts` - update socket.io logic to use emails
- `src/routes/liveClasses.routes.ts` - update to pass emails instead of UUIDs

---

## PHASE 3: Testing (After Code Updates)

1. **Local Build Test:**
```bash
cd Endubackend
npm run build
docker build -t test .
```

2. **Test Live Class Flow:**
- Create a new live class
- Join as student
- Check attendance records
- Verify recordings
- Test bookmarks

3. **Check Database:**
```sql
-- Verify new records use email
SELECT * FROM live_classes ORDER BY created_at DESC LIMIT 5;
SELECT * FROM live_class_participants ORDER BY joined_at DESC LIMIT 10;
```

---

## PHASE 4: Cleanup (Optional - After Everything Works)

**Only do this after weeks of testing!**

Once you're 100% confident the email system works:

```sql
-- Make email columns NOT NULL
ALTER TABLE live_classes ALTER COLUMN teacher_email SET NOT NULL;
ALTER TABLE live_class_participants ALTER COLUMN user_email SET NOT NULL;
ALTER TABLE live_class_attendance ALTER COLUMN student_email SET NOT NULL;

-- Optionally drop old UUID columns (DANGEROUS - backup first!)
-- ALTER TABLE live_classes DROP COLUMN teacher_id;
-- ALTER TABLE live_class_participants DROP COLUMN user_id;
-- ALTER TABLE live_class_attendance DROP COLUMN student_id;
```

---

## 🔄 Current Progress

- ✅ Created migration files (01-04)
- ✅ Created migration guide
- ⏳ **YOU ARE HERE** → Need to run database migrations
- ⏹️ Update backend code (waiting for DB migrations)
- ⏹️ Test everything
- ⏹️ Deploy to production

---

## 🆘 If Something Breaks

**Rollback Database:**
```sql
-- Remove email columns (keeps original UUID columns)
ALTER TABLE live_class_attendance DROP COLUMN IF EXISTS student_email;
ALTER TABLE live_class_participants DROP COLUMN IF EXISTS user_email;
ALTER TABLE live_classes DROP COLUMN IF EXISTS teacher_email;
DROP TABLE IF EXISTS recording_bookmarks CASCADE;
```

**Rollback Code:**
```bash
git checkout Endubackend/src/services/liveClass.service.ts
```

---

## 📝 Summary

**What We're Doing:**
- Adding email columns to tables that currently use UUIDs
- Keeping both UUID and email columns during transition
- No data loss, no breaking changes
- Backend can read from either column during transition

**Why This Is Safe:**
- Database has BOTH old (UUID) and new (email) columns
- Old code still works (uses UUID)
- New code uses email but can fall back to UUID
- You can test thoroughly before removing UUID columns

---

## Next Steps For You:

1. **Run the 4 database migrations in Supabase** (in order!)
2. **Verify they worked** (check the verification queries)
3. **Tell me when done** → I'll finish updating the backend code
4. **Test everything works**
5. **Deploy!**

Ready to start? Let me know when you've completed Phase 1 (database migrations)!

