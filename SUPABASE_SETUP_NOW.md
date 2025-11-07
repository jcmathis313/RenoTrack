# Supabase Setup - Execute Now

## Current Status
✅ Updated local `.env` file with Supabase connection string
⏳ Database schema needs to be created
⏳ Storage buckets need to be created
⏳ Vercel environment variables need to be set

---

## Step 1: Get Connection Pooling String (REQUIRED FOR VERCEL)

**This is the MOST CRITICAL step!**

1. **Open**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
2. **Scroll** to "Connection string" section
3. **Click** the "Connection pooling" tab (NOT "Direct connection")
4. **Copy** the connection string
5. **Replace** `[YOUR-PASSWORD]` with: `bTU0XoHzBE7hpGfx`
6. **Result should look like**:
   ```
   postgresql://postgres.blglwhbkoxbmcinmswoo:bTU0XoHzBE7hpGfx@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
7. **Save this string** - you'll need it for Vercel

---

## Step 2: Create Database Schema via Supabase Dashboard

Since direct connection from local might have restrictions, let's create the schema via Supabase:

### Option A: Using Supabase SQL Editor (Recommended)

1. **Open**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. **Copy** the Prisma schema SQL (see below)
3. **Paste** and run in SQL Editor

### Option B: Using Prisma Migrate (If connection works)

If the connection works, run:
```bash
npx prisma migrate dev --name init
```

---

## Step 3: Create Storage Buckets

1. **Open**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. **Copy** the contents of `scripts/create-supabase-buckets.sql`
3. **Paste** into SQL Editor
4. **Click** "Run"
5. **Verify**: Go to https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
   - You should see `communities` and `inspections` buckets

---

## Step 4: Set Up Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard
2. **Select** your RenoTrack project
3. **Click**: Settings → Environment Variables
4. **Add** these variables (select ALL environments: Production, Preview, Development):

   **DATABASE_URL**
   - Value: Connection pooling string from Step 1
   - Environments: ✅ Production ✅ Preview ✅ Development

   **NEXTAUTH_SECRET**
   - Value: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **NEXTAUTH_URL**
   - Value: `https://your-project.vercel.app` (update after first deployment)
   - Environments: ✅ Production ✅ Preview ✅ Development

   **SUPABASE_URL** (Optional)
   - Value: `https://blglwhbkoxbmcinmswoo.supabase.co`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **SUPABASE_ANON_KEY** (Optional)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`
   - Environments: ✅ Production ✅ Preview ✅ Development

---

## Step 5: Alternative - Create Schema via Prisma Studio

If direct connection doesn't work, try:

1. Check Supabase dashboard for IP restrictions
2. Try using the connection pooling string locally (might work better)
3. Or use Prisma's migration feature via Supabase dashboard

---

## Next Steps After Setup

1. ✅ Database schema created
2. ✅ Storage buckets created
3. ✅ Vercel environment variables set
4. ⏳ Deploy to Vercel
5. ⏳ Update NEXTAUTH_URL with actual Vercel URL
6. ⏳ Test the application

---

## Troubleshooting

### "Can't reach database server"
- Check if your IP is whitelisted in Supabase
- Try using connection pooling string instead of direct connection
- Verify the connection string is correct

### "Authentication failed"
- Verify password is correct: `bTU0XoHzBE7hpGfx`
- Check if database user exists

### Storage bucket errors
- Make sure buckets are set to "Public"
- Verify policies are created correctly
- Check bucket names match exactly: `communities` and `inspections`

