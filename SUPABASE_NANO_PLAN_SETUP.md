# Supabase Setup for Nano (Free) Plan

If you're on the Supabase **nano** (free) plan, here's how to find the settings:

## Finding Your Connection String

### Method 1: Project Settings → Database

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo
2. **Click** "Settings" (gear icon) in the left sidebar
3. **Click** "Database" in the settings menu
4. **Scroll down** to "Connection string" section
5. You should see:
   - **Direct connection** tab
   - **Connection pooling** tab
   - **URI** tab

### Method 2: Project API Settings

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/api
2. Look for **Database URL** or **Connection string**

### Method 3: Project Overview

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo
2. Look for **Database** section in the overview
3. Click **Connection string** or **Database URL**

---

## For Nano Plan - Use Direct Connection (If Pooling Not Available)

If connection pooling is not available on the nano plan, you can use the direct connection string for Vercel:

1. **Get Direct Connection String**:
   - Go to: Settings → Database
   - Copy the **Direct connection** string
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with: `bTU0XoHzBE7hpGfx`

2. **Use this for Vercel** (it will work, just less efficient than pooling)

---

## Alternative: Check Project Settings URL

Try these direct links:

- **Database Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database
- **API Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/api
- **General Settings**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/general

---

## What You Need to Find

You need these values:

1. **Database Connection String**
   - Format: `postgresql://postgres:PASSWORD@HOST:5432/postgres`
   - Password: `bTU0XoHzBE7hpGfx`
   - Host: `db.blglwhbkoxbmcinmswoo.supabase.co`

2. **Connection Pooling String** (if available)
   - Format: `postgresql://postgres.PROJECT:PASSWORD@pooler.supabase.com:6543/postgres?pgbouncer=true`
   - If not available, use direct connection

3. **Project URL**
   - Already have: `https://blglwhbkoxbmcinmswoo.supabase.co`

4. **API Key (Anon)**
   - Already have: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ2x3aGJrb3hibWNpbm1zd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE4ODksImV4cCI6MjA3ODA4Nzg4OX0.2CktMy2olrfvUq382IbcnRKPi3bJWFfcHXVJarnuBRo`

---

## Quick Setup Without Pooling

If you can't find connection pooling settings:

1. **Use Direct Connection for Vercel**:
   ```
   postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres
   ```

2. **This will work**, but you might hit connection limits under high load
   - For free tier/nano plan, this is usually fine
   - You can upgrade later if needed

---

## Screenshot Guide

Can you see these sections in your Supabase dashboard?

1. **Left Sidebar**:
   - Home
   - Table Editor
   - SQL Editor
   - Authentication
   - Storage
   - **Settings** (gear icon) ← Click this

2. **Settings Menu**:
   - General
   - **Database** ← Should have connection strings here
   - API
   - Auth
   - Storage
   - etc.

---

## If Settings Don't Appear

1. **Check if you're logged in** to the correct Supabase account
2. **Verify project access** - make sure you're the owner or have admin access
3. **Try a different browser** or clear cache
4. **Check project status** - make sure the project is active and not paused

---

## Next Steps

Once you find the connection string:

1. ✅ Create database schema (SQL Editor)
2. ✅ Create storage buckets (SQL Editor)
3. ✅ Set up Vercel environment variables
4. ✅ Deploy

Let me know what you see in the Settings → Database section!

