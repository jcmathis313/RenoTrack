# Supabase Storage Setup for Inspection Images

This guide will help you set up Supabase Storage buckets for storing inspection images (and optionally community logos).

## Prerequisites

- Supabase project created and running
- Access to your Supabase project dashboard
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables (or `SUPABASE_ANON_KEY`)

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/[PROJECT-REF]
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY` - keep this secret!)
   - **anon public key** (this is your `SUPABASE_ANON_KEY` - safe for client-side use)

## Step 2: Create Storage Buckets via SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `scripts/create-supabase-buckets.sql`
4. Replace `[PROJECT-REF]` in any comments with your actual project reference
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- `inspections` bucket - for inspection component images (10MB limit, public)
- `communities` bucket - for community logos (5MB limit, public)

## Step 3: Verify Buckets Were Created

1. Go to **Storage** in your Supabase dashboard
2. You should see both `inspections` and `communities` buckets listed
3. Click on each bucket to verify they are set to **Public**

## Step 4: Set Environment Variables

### For Local Development

Add to your `.env.local` file:

```env
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
# Optional, for client-side use:
SUPABASE_ANON_KEY=your-anon-key-here
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `SUPABASE_URL` = `https://[PROJECT-REF].supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - (Optional) `SUPABASE_ANON_KEY` = your anon key

**Important**: Use `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) for server-side uploads, as it bypasses Row Level Security (RLS) policies.

## Step 5: Test Image Upload

1. Start your development server: `npm run dev`
2. Navigate to an inspection page
3. Try uploading an image to an inspection component
4. Verify the image appears correctly
5. Check the Supabase Storage dashboard to confirm the file was uploaded

## Bucket Structure

Images are stored with the following structure:
- **Inspections**: `{tenantId}/{componentId}-{timestamp}.{extension}`
- **Communities**: `{communityId}-{timestamp}.{extension}`

This organization helps with:
- Multi-tenancy isolation (images grouped by tenant)
- Easy identification of uploaded files
- Preventing filename conflicts

## Troubleshooting

### Images not uploading

1. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
2. Verify the buckets exist and are public
3. Check the browser console and server logs for errors
4. Ensure the file size is within limits (10MB for inspections, 5MB for communities)
5. Verify the file type is allowed (JPEG, PNG, GIF, WebP)

### Images not displaying

1. Check that the bucket policies allow public read access
2. Verify the image URL in the database is a full Supabase URL (starts with `https://`)
3. Check browser console for CORS or 404 errors
4. Verify the Supabase project is active (not paused)

### Permission errors

1. Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for uploads
2. Check bucket policies allow the operations you need
3. Verify authentication is working in your application

## Migration from Local Storage

If you have existing images stored locally (`/uploads/inspections/...`), they will continue to work for viewing, but new uploads will use Supabase Storage. To migrate existing images:

1. Manually upload them to Supabase Storage via the dashboard
2. Or create a migration script to move them programmatically
3. Update database records with new Supabase URLs

## Security Notes

- **Public buckets**: Both buckets are set to public for easy access. If you need private storage, change the bucket settings and update access policies.
- **Service role key**: Never expose the service role key in client-side code. It should only be used in server-side API routes.
- **File validation**: The upload API validates file types and sizes on the server side, even if client-side validation exists.

