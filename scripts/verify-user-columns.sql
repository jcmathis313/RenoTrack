-- Verify and add missing columns to User table
-- This script checks for and adds phone, jobTitle, and profilePictureUrl columns

-- Check current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY column_name;

-- Add phone column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'phone'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "phone" TEXT;
        RAISE NOTICE 'Added phone column';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
END $$;

-- Add jobTitle column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'jobTitle'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT;
        RAISE NOTICE 'Added jobTitle column';
    ELSE
        RAISE NOTICE 'jobTitle column already exists';
    END IF;
END $$;

-- Add profilePictureUrl column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'profilePictureUrl'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "profilePictureUrl" TEXT;
        RAISE NOTICE 'Added profilePictureUrl column';
    ELSE
        RAISE NOTICE 'profilePictureUrl column already exists';
    END IF;
END $$;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('phone', 'jobTitle', 'profilePictureUrl')
ORDER BY column_name;

