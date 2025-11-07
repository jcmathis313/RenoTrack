-- Supabase Seed Script: Create Demo Tenant and User
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

-- Create demo tenant
INSERT INTO "Tenant" (id, slug, name, "createdAt", "updatedAt")
VALUES ('demo-tenant-001', 'demo', 'Demo Company', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = 'Demo Company', "updatedAt" = NOW();

-- Create demo admin user
-- Password: demo123
-- Hash: $2a$10$6kC3M10UlPXfjBoWw15NZeX6kgLUJLxzzN7iwOIZJwaEGUTRt1E/O
INSERT INTO "User" (id, email, password, name, role, "tenantId", "createdAt", "updatedAt")
SELECT 
  'demo-user-001',
  'admin@demo.com',
  '$2a$10$6kC3M10UlPXfjBoWw15NZeX6kgLUJLxzzN7iwOIZJwaEGUTRt1E/O',
  'Admin User',
  'Admin',
  id,
  NOW(),
  NOW()
FROM "Tenant"
WHERE slug = 'demo'
ON CONFLICT DO NOTHING;

-- Create default component statuses
INSERT INTO "ComponentStatus" (id, "tenantId", name, color, "order", "isDefault", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  id,
  status_data.name,
  status_data.color,
  status_data.order,
  true,
  NOW(),
  NOW()
FROM "Tenant", (VALUES
  ('Keep', 'green', 0),
  ('Replace', 'orange', 1),
  ('Repair', 'blue', 2),
  ('Remove', 'red', 3),
  ('Review', 'gray', 4)
) AS status_data(name, color, "order")
WHERE "Tenant".slug = 'demo'
ON CONFLICT DO NOTHING;

-- Create default quality statuses
INSERT INTO "QualityStatus" (id, "tenantId", name, "order", "isDefault", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  id,
  quality_data.name,
  quality_data.order,
  true,
  NOW(),
  NOW()
FROM "Tenant", (VALUES
  ('Excellent', 0),
  ('Great', 1),
  ('Fair', 2),
  ('Poor', 3)
) AS quality_data(name, "order")
WHERE "Tenant".slug = 'demo'
ON CONFLICT DO NOTHING;

-- Create default room templates
INSERT INTO "RoomTemplate" (id, "tenantId", name, "order", "isDefault", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  id,
  room_data.name,
  room_data.order,
  true,
  NOW(),
  NOW()
FROM "Tenant", (VALUES
  ('All Rooms', 0),
  ('Foyer', 1),
  ('Living Room', 2),
  ('Kitchen', 3),
  ('Bedroom 1', 4),
  ('Bedroom 2', 5),
  ('Bedroom 3', 6),
  ('Bathroom 1', 7),
  ('Bathroom 2', 8),
  ('Bathroom 3', 9),
  ('Den', 10),
  ('Powder Room', 11)
) AS room_data(name, "order")
WHERE "Tenant".slug = 'demo'
ON CONFLICT DO NOTHING;

-- Verify creation
SELECT 'Tenant created:' as info, slug, name FROM "Tenant" WHERE slug = 'demo';
SELECT 'User created:' as info, email, name, role FROM "User" WHERE email = 'admin@demo.com';

