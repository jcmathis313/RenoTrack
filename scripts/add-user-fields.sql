-- Add phone, jobTitle, and profilePictureUrl columns to User table
-- Run this SQL directly against your database if prisma db push times out

-- Add phone column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'phone'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "phone" TEXT;
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
    END IF;
END $$;

