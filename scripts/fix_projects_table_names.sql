-- Fix Projects table names to match Prisma's naming convention
-- Prisma uses exact model names as table names (case-sensitive)
-- Run this script in Supabase SQL Editor

-- Drop and recreate with correct names if they exist with wrong case
DO $$ 
BEGIN
    -- Drop existing tables if they exist (this will cascade delete foreign keys)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Project' AND table_schema = 'public') THEN
        DROP TABLE IF EXISTS "ProjectAssignment" CASCADE;
        DROP TABLE IF EXISTS "Project" CASCADE;
    END IF;
    
    -- Also drop if they exist as lowercase
    DROP TABLE IF EXISTS "projectassignment" CASCADE;
    DROP TABLE IF EXISTS "project" CASCADE;
END $$;

-- Create Project table with exact Prisma naming
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Create ProjectAssignment table
CREATE TABLE "ProjectAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Project_unitId_idx" ON "Project"("unitId");
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");
CREATE INDEX "ProjectAssignment_projectId_idx" ON "ProjectAssignment"("projectId");
CREATE INDEX "ProjectAssignment_userId_idx" ON "ProjectAssignment"("userId");
CREATE UNIQUE INDEX "ProjectAssignment_projectId_userId_key" ON "ProjectAssignment"("projectId", "userId");

-- Add foreign key constraints
ALTER TABLE "Project" ADD CONSTRAINT "Project_unitId_fkey" 
    FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ensure projectId columns exist in other tables (if they don't already)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Assessment' AND column_name = 'projectId') THEN
        ALTER TABLE "Assessment" ADD COLUMN "projectId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DesignProject' AND column_name = 'projectId') THEN
        ALTER TABLE "DesignProject" ADD COLUMN "projectId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Inspection' AND column_name = 'projectId') THEN
        ALTER TABLE "Inspection" ADD COLUMN "projectId" TEXT;
    END IF;
END $$;

-- Create indexes for projectId columns
CREATE INDEX IF NOT EXISTS "Assessment_projectId_idx" ON "Assessment"("projectId");
CREATE INDEX IF NOT EXISTS "DesignProject_projectId_idx" ON "DesignProject"("projectId");
CREATE INDEX IF NOT EXISTS "Inspection_projectId_idx" ON "Inspection"("projectId");

-- Add foreign key constraints for projectId columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Assessment_projectId_fkey') THEN
        ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DesignProject_projectId_fkey') THEN
        ALTER TABLE "DesignProject" ADD CONSTRAINT "DesignProject_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inspection_projectId_fkey') THEN
        ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify
SELECT 'Tables created successfully with correct naming' as status;
