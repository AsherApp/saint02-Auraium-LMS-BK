-- =====================================================
-- SQL QUERY TO LIST ALL TABLES (EXCLUDING VIEWS)
-- =====================================================
-- This query will show all actual tables in your database
-- and exclude views, materialized views, and system tables

-- Method 1: Using information_schema (Most Compatible)
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Method 2: Using pg_tables (PostgreSQL Specific - More Detailed)
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Method 3: Get Table Count and List (Summary View)
SELECT 
    COUNT(*) as total_tables,
    string_agg(table_name, ', ' ORDER BY table_name) as table_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- Method 4: Detailed Table Information with Column Count
SELECT 
    t.table_name,
    t.table_type,
    COALESCE(c.column_count, 0) as column_count,
    COALESCE(i.index_count, 0) as index_count
FROM information_schema.tables t
LEFT JOIN (
    SELECT 
        table_name,
        COUNT(*) as column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    GROUP BY table_name
) c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT 
        tablename,
        COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename
) i ON t.table_name = i.tablename
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Method 5: Compare Tables vs Views
SELECT 
    'TABLES' as object_type,
    COUNT(*) as count,
    string_agg(table_name, ', ' ORDER BY table_name) as object_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'VIEWS' as object_type,
    COUNT(*) as count,
    string_agg(table_name, ', ' ORDER BY table_name) as object_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'VIEW'

UNION ALL

SELECT 
    'MATERIALIZED VIEWS' as object_type,
    COUNT(*) as count,
    string_agg(table_name, ', ' ORDER BY table_name) as object_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'MATERIALIZED VIEW';

-- Method 6: Simple List (Just Table Names)
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- =====================================================
-- 1. Run Method 1 for a simple list of tables
-- 2. Run Method 2 for detailed PostgreSQL-specific info
-- 3. Run Method 3 for a quick count and summary
-- 4. Run Method 4 for comprehensive table information
-- 5. Run Method 5 to compare tables vs views
-- 6. Run Method 6 for just the table names (cleanest output)
--
-- All methods exclude:
-- - Views (table_type = 'VIEW')
-- - Materialized Views (table_type = 'MATERIALIZED VIEW')
-- - System tables (schema != 'public')
-- - Temporary tables
-- =====================================================
