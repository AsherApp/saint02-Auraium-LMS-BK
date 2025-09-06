# Consolidated Database Migrations

This directory contains the consolidated database migrations for the LMS system. These migrations replace the scattered migration files and provide a clean, organized structure.

## Migration Files

### 01_core_schema.sql
**Purpose**: Creates all core database tables, indexes, and basic relationships.

**Contains**:
- Core tables (students, teachers, courses, modules, lessons, enrollments)
- Assignment & Quiz tables (assignments, submissions, quizzes, quiz_responses, quiz_attempts)
- Progress tracking tables (student_progress, course_completions, module_completions)
- Live session tables (live_sessions, live_participants, live_attendance_records, etc.)
- Discussion & Communication tables (announcements, discussions, discussion_posts)
- Poll & Engagement tables (polls, poll_options, poll_responses)
- Student Activity & Grades tables (student_activities, student_grades)
- Notes & Files tables (notes, student_notes, Files)
- Notifications & Invites tables (notifications, invites)
- All necessary indexes for performance

### 02_functions_and_triggers.sql
**Purpose**: Creates all database functions and triggers.

**Contains**:
- `check_course_completion()`: Tracks course completion progress
- `sync_student_id()`: Automatically syncs student_id with student_email
- `update_updated_at_column()`: Automatically updates updated_at timestamps
- Course completion tracking triggers
- Student ID sync triggers
- Updated at timestamp triggers

### 03_row_level_security.sql
**Purpose**: Enables Row Level Security (RLS) and creates security policies.

**Contains**:
- RLS enabled on all tables
- Comprehensive security policies for:
  - Students (can only access their own data)
  - Teachers (can only access data for their courses)
  - Proper data isolation between users
- JWT-based authentication policies

### 04_views_and_utilities.sql
**Purpose**: Creates database views and utility functions.

**Contains**:
- **Views**:
  - `user_roles`: Authentication and role resolution
  - `student_progress_summary`: Student progress overview
  - `teacher_student_progress`: Teacher's view of student progress
  - `course_roster`: Course enrollment and invite status
  - `student_progress_dashboard`: Comprehensive student dashboard
  - `live_session_summary`: Live session statistics
  - `live_attendance_summary`: Attendance tracking
  - `course_analytics`: Course performance metrics
  - `student_engagement`: Student activity tracking
- **Functions**:
  - `get_user_role()`: Get user role by email
  - `is_user_enrolled()`: Check course enrollment
  - `is_user_teacher_of_course()`: Check if user teaches course
  - `get_course_completion_percentage()`: Get completion percentage
  - `get_student_progress_summary()`: Get detailed progress summary

## Usage

### For New Installations
Run the migrations in order:
1. `01_core_schema.sql`
2. `02_functions_and_triggers.sql`
3. `03_row_level_security.sql`
4. `04_views_and_utilities.sql`

### For Existing Installations
These consolidated migrations replace all the scattered migration files. If you have an existing database, you may need to:

1. **Backup your database** before running these migrations
2. **Check for conflicts** with existing tables/columns
3. **Run the migrations in order** as listed above
4. **Verify data integrity** after migration

## Key Features

### ✅ **Complete Database Schema**
- All tables that are actually used by the backend
- Proper foreign key relationships
- Performance-optimized indexes
- Consistent naming conventions

### ✅ **Security**
- Row Level Security (RLS) enabled on all tables
- Comprehensive security policies
- JWT-based authentication
- Data isolation between users

### ✅ **Performance**
- Optimized indexes for all frequently queried columns
- Efficient views for common queries
- Proper foreign key relationships
- Automatic timestamp updates

### ✅ **Maintainability**
- Clean, organized structure
- Comprehensive documentation
- Consistent naming conventions
- Modular design

## Tables Included

### Core Tables (6)
- `students`, `teachers`, `courses`, `modules`, `lessons`, `enrollments`

### Assignment & Quiz Tables (5)
- `assignments`, `submissions`, `quizzes`, `quiz_responses`, `quiz_attempts`

### Progress Tracking Tables (3)
- `student_progress`, `course_completions`, `module_completions`

### Live Session Tables (10)
- `live_sessions`, `live_participants`, `live_attendance_records`, `live_attendance_reports`, `live_attendance_settings`, `live_messages`, `live_notes`, `live_classwork`, `live_classwork_submissions`, `recordings`

### Discussion & Communication Tables (3)
- `announcements`, `discussions`, `discussion_posts`

### Poll & Engagement Tables (3)
- `polls`, `poll_options`, `poll_responses`

### Student Activity & Grades Tables (2)
- `student_activities`, `student_grades`

### Notes & Files Tables (3)
- `notes`, `student_notes`, `Files`

### Notifications & Invites Tables (2)
- `notifications`, `invites`

**Total: 37 tables** (all actively used by the backend)

## Migration Order

1. **01_core_schema.sql** - Creates all tables and indexes
2. **02_functions_and_triggers.sql** - Adds functions and triggers
3. **03_row_level_security.sql** - Enables security policies
4. **04_views_and_utilities.sql** - Adds views and utility functions

## Notes

- All migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for safety
- Foreign key relationships are properly defined
- All tables include `created_at` and `updated_at` timestamps
- Automatic triggers update `updated_at` timestamps
- Student ID sync is handled automatically via triggers
- Course completion tracking is automatic via triggers

## Support

If you encounter any issues with these migrations:

1. Check the migration order
2. Verify your database connection
3. Check for existing table conflicts
4. Review the error messages carefully
5. Ensure all dependencies are met

These consolidated migrations provide a clean, organized, and maintainable database structure for the LMS system.
