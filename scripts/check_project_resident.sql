-- Check if ProjectResident table exists and show its structure
-- Run this in Supabase SQL Editor

-- Check if ProjectResident table exists
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ProjectResident') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'ProjectResident';

-- If it exists, show all columns
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ProjectResident'
ORDER BY ordinal_position;

-- Also check for lowercase variant
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'projectresident') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'projectresident';

-- Show all tables with 'resident' in the name (case insensitive)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND LOWER(table_name) LIKE '%resident%'
ORDER BY table_name;

