-- Create Vendor table
CREATE TABLE IF NOT EXISTS "Vendor" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contact" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on tenantId and name
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_tenantId_name_key" ON "Vendor"("tenantId", "name");

-- Create index on tenantId
CREATE INDEX IF NOT EXISTS "Vendor_tenantId_idx" ON "Vendor"("tenantId");

-- Add foreign key constraint to Tenant table
ALTER TABLE "Vendor" 
ADD CONSTRAINT "Vendor_tenantId_fkey" 
FOREIGN KEY ("tenantId") 
REFERENCES "Tenant"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Check if vendorId column exists in DesignComponent table, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'DesignComponent' 
    AND column_name = 'vendorId'
  ) THEN
    ALTER TABLE "DesignComponent" 
    ADD COLUMN "vendorId" TEXT;
    
    -- Add foreign key constraint to Vendor table
    ALTER TABLE "DesignComponent" 
    ADD CONSTRAINT "DesignComponent_vendorId_fkey" 
    FOREIGN KEY ("vendorId") 
    REFERENCES "Vendor"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    -- Add index on vendorId
    CREATE INDEX IF NOT EXISTS "DesignComponent_vendorId_idx" ON "DesignComponent"("vendorId");
  END IF;
END $$;

