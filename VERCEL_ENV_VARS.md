# Vercel Environment Variables Setup

## Your Supabase Details

- **Project URL**: https://blglwhbkoxbmcinmswoo.supabase.co
- **API Key (Anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`

## ⚠️ Important: Get Connection Pooling String

Your current connection string is a direct connection. For Vercel, you need the **Connection Pooling** version:

1. Go to: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
2. Scroll to **Connection string** section
3. Click **Connection pooling** tab
4. Copy the connection string
5. It should look like:
   ```
   postgresql://postgres.blglwhbkoxbmcinmswoo:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
6. Replace `[PASSWORD]` with: `bTU0XoHzBE7hpGfx`

## Environment Variables for Vercel

Add these to your Vercel project:

### 1. DATABASE_URL (Required)
- **Key**: `DATABASE_URL`
- **Value**: Connection pooling string from above
- **Environments**: Production, Preview, Development (all three)

### 2. NEXTAUTH_SECRET (Required)
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
- **Environments**: Production, Preview, Development (all three)

### 3. NEXTAUTH_URL (Required - Update after deployment)
- **Key**: `NEXTAUTH_URL`
- **Value**: Leave empty initially, then update to your Vercel URL after deployment
- **Environments**: Production, Preview, Development (all three)

### 4. SUPABASE_URL (Optional but Recommended)
- **Key**: `SUPABASE_URL`
- **Value**: `https://blglwhbkoxbmcinmswoo.supabase.co`
- **Environments**: Production, Preview, Development (all three)

### 5. SUPABASE_ANON_KEY (Optional but Recommended)
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`
- **Environments**: Production, Preview, Development (all three)

## Quick Setup Steps

1. **Get Connection Pooling String**:
   - Go to Supabase Database Settings
   - Copy Connection pooling URI
   - Replace password placeholder with: `bTU0XoHzBE7hpGfx`

2. **Add to Vercel**:
   - Go to Vercel Project → Settings → Environment Variables
   - Add all 5 variables above
   - Make sure to select all environments for each

3. **Deploy**:
   - Click Deploy
   - Wait for build to complete

4. **Update NEXTAUTH_URL**:
   - After deployment, get your Vercel URL
   - Update `NEXTAUTH_URL` environment variable
   - Redeploy

