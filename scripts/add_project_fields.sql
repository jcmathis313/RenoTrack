-- Add Project fields: Dates, Residents, and Notes
-- Run this script in Supabase SQL Editor

-- 1. Add date columns to Project table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'vacancyDate') THEN
        ALTER TABLE "Project" ADD COLUMN "vacancyDate" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'moveInDate') THEN
        ALTER TABLE "Project" ADD COLUMN "moveInDate" TIMESTAMP(3);
    END IF;
END $$;

-- 2. Create ProjectResident table
CREATE TABLE IF NOT EXISTS "ProjectResident" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectResident_pkey" PRIMARY KEY ("id")
);

-- 3. Create ProjectNote table
CREATE TABLE IF NOT EXISTS "ProjectNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- 4. Create indexes for ProjectResident
CREATE INDEX IF NOT EXISTS "ProjectResident_projectId_idx" ON "ProjectResident"("projectId");

-- 5. Create indexes for ProjectNote
CREATE INDEX IF NOT EXISTS "ProjectNote_projectId_idx" ON "ProjectNote"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectNote_createdAt_idx" ON "ProjectNote"("createdAt");

-- 6. Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectResident_projectId_fkey') THEN
        ALTER TABLE "ProjectResident" ADD CONSTRAINT "ProjectResident_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectNote_projectId_fkey') THEN
        ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the changes
SELECT 'Project fields and tables added successfully' as status;



