# Supabase Storage Buckets Setup

## Your Supabase Project Details

- **Project URL**: https://blglwhbkoxbmcinmswoo.supabase.co
- **Project Reference**: `blglwhbkoxbmcinmswoo`
- **Connection String**: `postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres`

## ⚠️ Important: Connection String for Vercel

The connection string you provided is a **direct connection**. For Vercel serverless functions, you need the **Connection Pooling** version:

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Copy that connection string (it will have `pooler.supabase.com` and `pgbouncer=true`)
5. Use that for Vercel environment variable

Example format:
```
postgresql://postgres.blglwhbkoxbmcinmswoo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Method 1: Create Buckets via Supabase Dashboard (Easiest)

### Step 1: Create Communities Bucket

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. Click **New bucket**
3. Fill in:
   - **Name**: `communities`
   - **Public bucket**: Toggle **ON** (make it public)
   - **File size limit**: `5 MB` (or leave default)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp` (optional)
4. Click **Create bucket**

### Step 2: Create Inspections Bucket

1. Click **New bucket** again
2. Fill in:
   - **Name**: `inspections`
   - **Public bucket**: Toggle **ON**
   - **File size limit**: `10 MB` (or leave default)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp` (optional)
3. Click **Create bucket**

### Step 3: Set Up Bucket Policies

1. Click on the `communities` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization**
5. Add these policies (repeat for both buckets):

**Policy 1: Public Read Access**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `true`

**Policy 2: Authenticated Upload**
- Policy name: `Authenticated upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `true`

**Policy 3: Authenticated Update**
- Policy name: `Authenticated update`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `true`

**Policy 4: Authenticated Delete**
- Policy name: `Authenticated delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `true`

## Method 2: Create Buckets via SQL (Faster)

### Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. Or click **SQL Editor** in left sidebar → **New query**

### Step 2: Run the SQL Script

1. Copy the contents of `scripts/create-supabase-buckets.sql`
2. Paste into SQL Editor
3. Click **Run** (or press Cmd/Ctrl + Enter)
4. You should see success messages

### Step 3: Verify Buckets Created

1. Go to **Storage** → **Buckets**
2. You should see:
   - ✅ `communities` bucket
   - ✅ `inspections` bucket

## Verify Setup

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. You should see both buckets listed
3. Click on each bucket to verify they're set to **Public**

## Next Steps

After creating buckets:
1. ✅ Use connection pooling string for Vercel
2. ✅ Set up Vercel deployment
3. ⏳ Update file upload code to use Supabase Storage (future task)

## Quick Reference

- **Storage Dashboard**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
- **SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
- **Database Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database

