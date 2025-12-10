-- Verify that Project tables and columns exist
-- Run this in Supabase SQL Editor to check what's actually in your database

-- Check if Project table has the new date columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Project' 
    AND column_name IN ('vacancyDate', 'moveInDate')
ORDER BY column_name;

-- Check if ProjectResident table exists
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ProjectResident') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'ProjectResident';

-- Check if ProjectNote table exists
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ProjectNote') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'ProjectNote';

-- List all Project-related tables (to check for case issues)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE '%project%' OR table_name LIKE '%Project%')
ORDER BY table_name;

-- Check ProjectResident columns if table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ProjectResident'
ORDER BY ordinal_position;

-- Check ProjectNote columns if table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ProjectNote'
ORDER BY ordinal_position;

