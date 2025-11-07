# Quick Fix for Login Error

## The Problem
- Database connection is failing locally
- This causes the "Server Configuration" error when trying to log in

## The Solution

Set up the database and test user directly in Supabase (since local connection might not work).

---

## Step 1: Create Database Schema (If Not Done Yet)

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

2. **Open** `scripts/supabase-init-schema.sql` from your project

3. **Copy** and paste the entire SQL script

4. **Click** "Run"

5. **Verify**: Go to https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
   - You should see all tables ✅

---

## Step 2: Create Test User

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new

2. **Open** `scripts/supabase-seed-user.sql` from your project

3. **Copy** and paste the entire SQL script

4. **Click** "Run"

5. **Verify**: You should see output like:
   - "Tenant created: demo"
   - "User created: admin@demo.com"

---

## Step 3: Test Login

### Option A: Test on Vercel (Recommended)

1. **Go to** your Vercel deployment URL
2. **Try to log in** with:
   - **Tenant**: `demo`
   - **Email**: `admin@demo.com`
   - **Password**: `demo123`

### Option B: Test Locally (If Connection Works)

1. **Restart** your dev server:
   ```bash
   npm run dev
   ```

2. **Go to**: http://localhost:3000/login

3. **Log in** with:
   - **Tenant**: `demo`
   - **Email**: `admin@demo.com`
   - **Password**: `demo123`

---

## Test Login Credentials

After running the SQL script above:

- **Tenant Slug**: `demo`
- **Email**: `admin@demo.com`
- **Password**: `demo123`

---

## If It Still Doesn't Work

### Check Vercel Environment Variables

1. **Go to**: Vercel Dashboard → Settings → Environment Variables
2. **Verify**:
   - ✅ `DATABASE_URL` is set (with your Supabase connection string)
   - ✅ `NEXTAUTH_SECRET` is set
   - ✅ `NEXTAUTH_URL` is set (your Vercel URL)

### Check Vercel Deployment Logs

1. **Go to**: Vercel Dashboard → Deployments → Latest
2. **Check** build logs for errors
3. **Check** runtime logs for database connection errors

---

## Why Local Connection Might Not Work

- **IP Restrictions**: Supabase might have IP restrictions enabled
- **Network Issues**: Firewall or network blocking the connection
- **Connection String**: Might need to use a different connection method

**Solution**: Use Vercel for testing (where the connection should work if environment variables are set correctly).

---

## Next Steps

1. ✅ Run database schema SQL in Supabase
2. ✅ Run seed user SQL in Supabase  
3. ✅ Test login on Vercel
4. ✅ If it works on Vercel, you're good to go!

The local connection issue won't affect your production deployment on Vercel.

