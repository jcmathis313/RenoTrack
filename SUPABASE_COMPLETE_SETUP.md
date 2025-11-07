# Complete Supabase Setup Guide

## Prerequisites
- Supabase project created: `blglwhbkoxbmcinmswoo`
- Connection details provided
- Vercel project ready

## Step 1: Get Connection Pooling String ⚠️ CRITICAL

**This is the MOST IMPORTANT step for Vercel deployment!**

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
2. Scroll to **Connection string** section
3. Click **Connection pooling** tab
4. Copy the connection string (it should look like):
   ```
   postgresql://postgres.blglwhbkoxbmcinmswoo:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Replace `[PASSWORD]` with your actual password: `bTU0XoHzBE7hpGfx`
6. **Save this string** - you'll need it for Vercel environment variables

**Why?** Direct connections don't work well with serverless functions. Connection pooling is required for Vercel.

---

## Step 2: Create Database Schema

### Option A: Using Prisma (Recommended)

1. **Update your local `.env` file** (or create it):
   ```bash
   DATABASE_URL="postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres"
   NEXTAUTH_SECRET="VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys="
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Push the schema to Supabase**:
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Verify the schema** (optional):
   ```bash
   npx prisma studio
   ```
   This opens a visual database browser at http://localhost:5555

### Option B: Using Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. Run the Prisma migrations manually (not recommended - use Option A)

---

## Step 3: Create Storage Buckets

### Method 1: Via SQL (Fastest)

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. Open `scripts/create-supabase-buckets.sql` from your project
3. Copy and paste the entire SQL into the editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see success messages

### Method 2: Via Dashboard

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. Click **New bucket**
3. Create `communities` bucket:
   - Name: `communities`
   - Public bucket: **ON** (toggle it)
   - File size limit: `5 MB` (optional)
4. Click **Create bucket**
5. Repeat for `inspections` bucket:
   - Name: `inspections`
   - Public bucket: **ON**
   - File size limit: `10 MB` (optional)

6. **Set up bucket policies** (for each bucket):
   - Go to the bucket → **Policies** tab
   - Click **New Policy**
   - Select **For full customization**
   - Add these 4 policies:
     
     **Policy 1: Public Read**
     - Name: `Public read access`
     - Operation: `SELECT`
     - Target roles: `public`
     - USING: `true`
     
     **Policy 2: Authenticated Upload**
     - Name: `Authenticated upload`
     - Operation: `INSERT`
     - Target roles: `authenticated`
     - WITH CHECK: `true`
     
     **Policy 3: Authenticated Update**
     - Name: `Authenticated update`
     - Operation: `UPDATE`
     - Target roles: `authenticated`
     - USING: `true`
     
     **Policy 4: Authenticated Delete**
     - Name: `Authenticated delete`
     - Operation: `DELETE`
     - Target roles: `authenticated`
     - USING: `true`

---

## Step 4: Set Up Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your **RenoTrack** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables (make sure to select **Production**, **Preview**, and **Development** for each):

### Required Variables:

**1. DATABASE_URL**
- Key: `DATABASE_URL`
- Value: Connection pooling string from Step 1 (with password replaced)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**2. NEXTAUTH_SECRET**
- Key: `NEXTAUTH_SECRET`
- Value: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**3. NEXTAUTH_URL**
- Key: `NEXTAUTH_URL`
- Value: Leave empty for now (update after first deployment with your Vercel URL)
- Example: `https://your-project.vercel.app`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**4. SUPABASE_URL** (Optional but Recommended)
- Key: `SUPABASE_URL`
- Value: `https://blglwhbkoxbmcinmswoo.supabase.co`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**5. SUPABASE_ANON_KEY** (Optional but Recommended)
- Key: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`
- Environments: ✅ Production, ✅ Preview, ✅ Development

---

## Step 5: Verify Setup

### Verify Database:
1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
2. You should see all your tables (Tenant, User, Community, Building, Unit, etc.)

### Verify Storage:
1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. You should see:
   - ✅ `communities` bucket (public)
   - ✅ `inspections` bucket (public)

### Verify Vercel:
1. Trigger a new deployment in Vercel
2. Check the build logs - it should connect to the database successfully
3. After deployment, update `NEXTAUTH_URL` with your actual Vercel URL

---

## Step 6: Seed Database (Optional)

If you want to add initial data:

1. Update your `.env` file with the Supabase connection string
2. Run the seed script:
   ```bash
   npm run db:seed
   ```

---

## Troubleshooting

### "Connection refused" errors:
- Make sure you're using the **Connection Pooling** string for Vercel
- Direct connection strings don't work with serverless functions

### "Table does not exist" errors:
- Run `npx prisma db push` to create the schema
- Check that the DATABASE_URL is correct

### Storage bucket errors:
- Make sure buckets are set to **Public**
- Verify policies are set up correctly
- Check that you're using the correct bucket names

### Authentication errors:
- Make sure `NEXTAUTH_SECRET` is set
- Update `NEXTAUTH_URL` after first deployment
- Check that cookies are enabled in your browser

---

## Quick Reference Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo
- **Database Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
- **Storage Buckets**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
- **SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## Next Steps After Setup

1. ✅ Database schema created
2. ✅ Storage buckets created
3. ✅ Vercel environment variables set
4. ✅ Deploy to Vercel
5. ✅ Test the application
6. ✅ Create your first user/tenant

