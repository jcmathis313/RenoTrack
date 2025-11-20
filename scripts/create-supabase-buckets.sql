-- SQL script to create Supabase storage buckets
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[PROJECT-REF]/sql
-- Replace [PROJECT-REF] with your Supabase project reference

-- Create communities bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'communities',
  'communities',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create inspections bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspections',
  'inspections',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Communities bucket is public" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to communities" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update communities" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from communities" ON storage.objects;

DROP POLICY IF EXISTS "Inspections bucket is public" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from inspections" ON storage.objects;

-- Set up policies for communities bucket
CREATE POLICY "Communities bucket is public"
ON storage.objects FOR SELECT
USING (bucket_id = 'communities');

CREATE POLICY "Authenticated users can upload to communities"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'communities' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update communities"
ON storage.objects FOR UPDATE
USING (bucket_id = 'communities' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from communities"
ON storage.objects FOR DELETE
USING (bucket_id = 'communities' AND auth.role() = 'authenticated');

-- Set up policies for inspections bucket
-- Public read access (anyone can view images)
CREATE POLICY "Inspections bucket is public"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspections');

-- Allow authenticated users to upload (API route handles tenant verification)
-- Note: Using service_role key in API route bypasses RLS, but policies are still good practice
CREATE POLICY "Authenticated users can upload to inspections"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspections' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update inspections"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspections' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from inspections"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspections' AND auth.role() = 'authenticated');

