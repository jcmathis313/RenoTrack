-- Add Projects System
-- Run this script in Supabase SQL Editor

-- 1. Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- 2. Create ProjectAssignment table (many-to-many between Project and User)
CREATE TABLE IF NOT EXISTS "ProjectAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- 3. Add projectId column to Assessment table
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- 4. Add projectId column to DesignProject table
ALTER TABLE "DesignProject" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- 5. Add projectId column to Inspection table
ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- 6. Create indexes for Project table
CREATE INDEX IF NOT EXISTS "Project_unitId_idx" ON "Project"("unitId");
CREATE INDEX IF NOT EXISTS "Project_tenantId_idx" ON "Project"("tenantId");

-- 7. Create indexes for ProjectAssignment table
CREATE INDEX IF NOT EXISTS "ProjectAssignment_projectId_idx" ON "ProjectAssignment"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectAssignment_userId_idx" ON "ProjectAssignment"("userId");

-- 8. Create unique constraint for ProjectAssignment (one assignment per user per project)
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectAssignment_projectId_userId_key" ON "ProjectAssignment"("projectId", "userId");

-- 9. Create indexes for new projectId columns
CREATE INDEX IF NOT EXISTS "Assessment_projectId_idx" ON "Assessment"("projectId");
CREATE INDEX IF NOT EXISTS "DesignProject_projectId_idx" ON "DesignProject"("projectId");
CREATE INDEX IF NOT EXISTS "Inspection_projectId_idx" ON "Inspection"("projectId");

-- 10. Add foreign key constraints for Project table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Project_unitId_fkey'
    ) THEN
        ALTER TABLE "Project" ADD CONSTRAINT "Project_unitId_fkey" 
            FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Project_tenantId_fkey'
    ) THEN
        ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 11. Add foreign key constraints for ProjectAssignment table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProjectAssignment_projectId_fkey'
    ) THEN
        ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProjectAssignment_userId_fkey'
    ) THEN
        ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 12. Add foreign key constraints for projectId columns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Assessment_projectId_fkey'
    ) THEN
        ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DesignProject_projectId_fkey'
    ) THEN
        ALTER TABLE "DesignProject" ADD CONSTRAINT "DesignProject_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Inspection_projectId_fkey'
    ) THEN
        ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the changes
SELECT 
    'Tables created successfully' as status,
    COUNT(*) as project_count
FROM "Project";

