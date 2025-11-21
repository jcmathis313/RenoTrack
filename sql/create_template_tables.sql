-- Create Template table
CREATE TABLE IF NOT EXISTS "Template" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- Create TemplateRoom table
CREATE TABLE IF NOT EXISTS "TemplateRoom" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateRoom_pkey" PRIMARY KEY ("id")
);

-- Create TemplateComponent table
CREATE TABLE IF NOT EXISTS "TemplateComponent" (
    "id" TEXT NOT NULL,
    "templateRoomId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "componentName" TEXT,
    "condition" TEXT,
    "materialId" TEXT,
    "vendorId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateComponent_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Template_tenantId_idx" ON "Template"("tenantId");
CREATE INDEX IF NOT EXISTS "TemplateRoom_templateId_idx" ON "TemplateRoom"("templateId");
CREATE INDEX IF NOT EXISTS "TemplateComponent_templateRoomId_idx" ON "TemplateComponent"("templateRoomId");

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Template_tenantId_name_key" ON "Template"("tenantId", "name");

-- Add foreign key constraints
ALTER TABLE "Template" ADD CONSTRAINT "Template_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateRoom" ADD CONSTRAINT "TemplateRoom_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateComponent" ADD CONSTRAINT "TemplateComponent_templateRoomId_fkey" FOREIGN KEY ("templateRoomId") REFERENCES "TemplateRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

