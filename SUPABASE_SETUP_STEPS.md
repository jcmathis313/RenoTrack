# Supabase Setup - Step by Step

## Your Supabase Project Details
- **Project URL**: https://blglwhbkoxbmcinmswoo.supabase.co
- **Project Reference**: `blglwhbkoxbmcinmswoo`
- **Direct Connection**: `postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`

---

## Step 1: Get Connection Pooling String (CRITICAL FOR VERCEL)

1. Open: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
2. Scroll to **Connection string** section
3. Click **Connection pooling** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.blglwhbkoxbmcinmswoo:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Replace `[PASSWORD]` with: `bTU0XoHzBE7hpGfx`
6. **Save this full string** - you'll need it for Vercel

---

## Step 2: Update Local .env File

Update your `.env` file with:

```bash
# Direct connection (for local development)
DATABASE_URL="postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres"

# Auth secrets
NEXTAUTH_SECRET="VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys="
NEXTAUTH_URL="http://localhost:3000"

# Supabase (optional)
SUPABASE_URL="https://blglwhbkoxbmcinmswoo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo"
```

---

## Step 3: Create Database Schema

Run these commands in your terminal:

```bash
# Make sure you're in the project directory
cd /Users/jamesmathis/TurnTrack

# Push the Prisma schema to Supabase
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

This will create all tables in your Supabase database.

---

## Step 4: Create Storage Buckets

### Option A: Using SQL (Fastest)

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. Open `scripts/create-supabase-buckets.sql` from your project
3. Copy and paste the entire SQL
4. Click **Run**
5. You should see success messages

### Option B: Using Dashboard

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. Create `communities` bucket (Public: ON)
3. Create `inspections` bucket (Public: ON)
4. Set up policies (see SUPABASE_BUCKETS_SETUP.md for details)

---

## Step 5: Set Up Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your **RenoTrack** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Required:
- **DATABASE_URL**: Connection pooling string from Step 1
- **NEXTAUTH_SECRET**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
- **NEXTAUTH_URL**: Your Vercel URL (e.g., `https://your-project.vercel.app`)

### Optional but Recommended:
- **SUPABASE_URL**: `https://blglwhbkoxbmcinmswoo.supabase.co`
- **SUPABASE_ANON_KEY**: (your API key from above)

**Important**: Select all environments (Production, Preview, Development) for each variable.

---

## Step 6: Verify Setup

### Verify Database:
1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
2. You should see all your tables

### Verify Storage:
1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. You should see `communities` and `inspections` buckets

### Verify Vercel:
1. Trigger a new deployment
2. Check build logs - should connect to database successfully

---

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo
- **Database Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
- **Storage Buckets**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
- **SQL Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

