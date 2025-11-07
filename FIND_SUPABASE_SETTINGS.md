# How to Find Supabase Settings on Nano Plan

## Step 1: Access Your Project

1. Go to: https://supabase.com/dashboard
2. Click on your project: **blglwhbkoxbmcinmswoo**

## Step 2: Find Database Connection String

### Method 1: Settings → Database

1. In the left sidebar, click **Settings** (⚙️ gear icon)
2. Click **Database** in the settings menu
3. Scroll down to find **Connection string** or **Connection info**
4. Look for:
   - **URI** format
   - **Connection string** 
   - **Database URL**

### Method 2: Project Overview

1. On your project dashboard
2. Look for a **Database** card or section
3. Click on it to see connection details

### Method 3: SQL Editor

1. Click **SQL Editor** in left sidebar
2. Look for connection info at the top

## Step 3: What You're Looking For

You need a connection string that looks like:

```
postgresql://postgres:[PASSWORD]@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres
```

Or it might be shown as separate fields:
- **Host**: `db.blglwhbkoxbmcinmswoo.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `bTU0XoHzBE7hpGfx`

## Step 4: For Nano Plan - Use Direct Connection

On the free/nano plan, you might not see "Connection pooling". That's okay!

**Use the direct connection string**:
```
postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres
```

This will work for Vercel, just might be less efficient under high load (which is fine for free tier).

## Step 5: Alternative - Construct the String Manually

If you can't find it, you can construct it:

**Format**:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Your values**:
- User: `postgres`
- Password: `bTU0XoHzBE7hpGfx`
- Host: `db.blglwhbkoxbmcinmswoo.supabase.co`
- Port: `5432`
- Database: `postgres`

**Result**:
```
postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres
```

## What If You Still Can't Find It?

1. **Check Project Status**: Make sure project is active (not paused)
2. **Verify Access**: Make sure you're the project owner
3. **Try Different View**: Switch between "Table view" and "Card view" in settings
4. **Check API Tab**: Go to Settings → API, might have database info there

## Screenshots to Look For

In the Settings → Database page, you should see sections like:
- **Connection info**
- **Connection string**
- **Database URL**
- **Connection pooling** (might not be available on nano)

## Next Steps Once You Find It

1. ✅ Copy the connection string
2. ✅ Use it for Vercel `DATABASE_URL`
3. ✅ Create database schema (SQL Editor)
4. ✅ Create storage buckets (SQL Editor)
5. ✅ Deploy to Vercel

---

## Quick Test

Try this direct URL to see if it shows your settings:

https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/settings/database

What do you see on that page?

