-- SQL script to create Supabase storage buckets
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[PROJECT-REF]/sql

-- Create communities bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'communities',
  'communities',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create inspections bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspections',
  'inspections',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

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
CREATE POLICY "Inspections bucket is public"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspections');

CREATE POLICY "Authenticated users can upload to inspections"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspections' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inspections"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspections' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from inspections"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspections' AND auth.role() = 'authenticated');

