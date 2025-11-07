# Supabase Setup - Quick Start Guide

## ✅ What's Been Done
1. ✅ Updated local `.env` file with Supabase connection
2. ✅ Generated database schema SQL script
3. ✅ Created storage buckets SQL script
4. ✅ Prepared setup guides

## 🚀 Next Steps (Do These Now)

### Step 1: Create Database Schema in Supabase

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

2. **Copy the schema SQL**: Open `scripts/supabase-init-schema.sql` from your project

3. **Paste and Run**: 
   - Paste the entire SQL into the Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for success message

4. **Verify**: Go to https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
   - You should see all tables: Tenant, User, Community, Building, Unit, Assessment, etc.

---

### Step 2: Create Storage Buckets

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

2. **Copy the buckets SQL**: Open `scripts/create-supabase-buckets.sql` from your project

3. **Paste and Run**:
   - Paste the entire SQL into the Supabase SQL Editor
   - Click "Run"
   - Wait for success message

4. **Verify**: Go to https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
   - You should see:
     - ✅ `communities` bucket (Public)
     - ✅ `inspections` bucket (Public)

---

### Step 3: Get Connection Pooling String (CRITICAL!)

1. **Open**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database

2. **Scroll** to "Connection string" section

3. **Click** "Connection pooling" tab (NOT "Direct connection")

4. **Copy** the connection string

5. **Replace** `[YOUR-PASSWORD]` with: `bTU0XoHzBE7hpGfx`

6. **Full string should look like**:
   ```
   postgresql://postgres.blglwhbkoxbmcinmswoo:bTU0XoHzBE7hpGfx@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

7. **Save this string** - you'll need it for Vercel!

---

### Step 4: Set Up Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard

2. **Select** your RenoTrack project

3. **Go to**: Settings → Environment Variables

4. **Add these variables** (select ALL environments for each):

   #### DATABASE_URL (Required)
   - **Value**: Connection pooling string from Step 3
   - **Environments**: ✅ Production ✅ Preview ✅ Development

   #### NEXTAUTH_SECRET (Required)
   - **Value**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
   - **Environments**: ✅ Production ✅ Preview ✅ Development

   #### NEXTAUTH_URL (Required - Update after deployment)
   - **Value**: Leave empty for now, update after first deployment with your Vercel URL
   - Example: `https://renotrack-xxx.vercel.app`
   - **Environments**: ✅ Production ✅ Preview ✅ Development

   #### SUPABASE_URL (Optional)
   - **Value**: `https://blglwhbkoxbmcinmswoo.supabase.co`
   - **Environments**: ✅ Production ✅ Preview ✅ Development

   #### SUPABASE_ANON_KEY (Optional)
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`
   - **Environments**: ✅ Production ✅ Preview ✅ Development

---

### Step 5: Deploy to Vercel

1. **Trigger a new deployment** in Vercel (or push a commit to trigger auto-deploy)

2. **Check build logs** - should connect to database successfully

3. **After deployment**, update `NEXTAUTH_URL` with your actual Vercel URL

---

## 📋 Checklist

- [ ] Database schema created in Supabase
- [ ] Storage buckets created (`communities` and `inspections`)
- [ ] Connection pooling string obtained
- [ ] Vercel environment variables set
- [ ] First deployment successful
- [ ] NEXTAUTH_URL updated with Vercel URL

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo
- **SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
- **Database Tables**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
- **Storage Buckets**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
- **Database Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🆘 Troubleshooting

### Database connection fails
- Make sure you're using the **Connection Pooling** string for Vercel
- Direct connection strings don't work well with serverless functions

### Tables not showing
- Verify the SQL ran successfully
- Check the Supabase logs for errors
- Make sure you're in the correct project

### Storage buckets not working
- Verify buckets are set to **Public**
- Check that policies are created
- Verify bucket names: `communities` and `inspections`

### Vercel build fails
- Check that `DATABASE_URL` uses connection pooling string
- Verify all environment variables are set
- Check build logs for specific errors

