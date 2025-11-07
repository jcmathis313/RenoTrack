# Troubleshooting "Server Configuration" Error

## Common Causes

This error usually means:
1. **Database connection failed** - Can't connect to Supabase
2. **Database tables don't exist** - Schema not created yet
3. **NextAuth configuration issue** - Missing environment variables
4. **Seed data not created** - No users exist in database

---

## Step 1: Check if Database Tables Exist

### Check in Supabase:

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
2. **Check** if you see these tables:
   - `Tenant`
   - `User`
   - `Community`
   - etc.

**If tables don't exist** → Run the database schema SQL script first

**If tables exist** → Continue to Step 2

---

## Step 2: Check if Seed Data Exists

### Check in Supabase SQL Editor:

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/sql/new
2. **Run this query**:
   ```sql
   SELECT * FROM "Tenant" WHERE slug = 'demo';
   ```
3. **Run this query**:
   ```sql
   SELECT * FROM "User" WHERE email = 'admin@demo.com';
   ```

**If no results** → Run the seed script:
```bash
npm run db:seed
```

**If results exist** → Continue to Step 3

---

## Step 3: Check Server Logs

### If running locally:

1. **Check your terminal** where `npm run dev` is running
2. **Look for error messages** about:
   - Database connection
   - NextAuth errors
   - Missing environment variables

### If running on Vercel:

1. **Go to**: https://vercel.com/dashboard
2. **Select** your project
3. **Go to** Deployments → Latest deployment → Logs
4. **Check** for error messages

---

## Step 4: Verify Environment Variables

### Check local `.env` file:

```bash
cat .env
```

Should have:
- ✅ `DATABASE_URL` (with Supabase connection string)
- ✅ `NEXTAUTH_SECRET` (should have a value)
- ✅ `NEXTAUTH_URL` (should be `http://localhost:3000` for local)

### Check Vercel environment variables:

1. **Go to**: Vercel Dashboard → Settings → Environment Variables
2. **Verify**:
   - ✅ `DATABASE_URL` is set
   - ✅ `NEXTAUTH_SECRET` is set
   - ✅ `NEXTAUTH_URL` is set (for production)

---

## Step 5: Test Database Connection

### Test locally:

```bash
# Test Prisma connection
npx prisma studio
```

If Prisma Studio opens → Database connection works ✅

If it fails → Database connection issue ❌

---

## Step 6: Common Fixes

### Fix 1: Database Schema Not Created

**Solution**: Run the database schema SQL script in Supabase SQL Editor

### Fix 2: Seed Data Not Created

**Solution**: Run the seed script
```bash
npm run db:seed
```

### Fix 3: Wrong NEXTAUTH_URL

**If running locally**: Should be `http://localhost:3000`
**If running on Vercel**: Should be your Vercel URL (e.g., `https://your-app.vercel.app`)

### Fix 4: Database Connection String Wrong

**Check**: Make sure `DATABASE_URL` in `.env` matches your Supabase connection string

### Fix 5: NEXTAUTH_SECRET Missing

**Check**: Make sure `NEXTAUTH_SECRET` is set in both local `.env` and Vercel

---

## Quick Diagnostic Script

Run this to check everything:

```bash
# 1. Check .env file
echo "Checking .env file..."
cat .env | grep -E "DATABASE_URL|NEXTAUTH"

# 2. Test database connection
echo "Testing database connection..."
npx prisma studio &
sleep 5
kill %1

# 3. Check if tables exist
echo "Checking if tables exist..."
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Tenant\";"

# 4. Check if seed data exists
echo "Checking if seed data exists..."
npx prisma db execute --stdin <<< "SELECT * FROM \"Tenant\" WHERE slug = 'demo';"
```

---

## Most Likely Issues

Based on the error, the most likely causes are:

1. **Database tables don't exist** (80% chance)
   - **Fix**: Run the database schema SQL script

2. **Seed data not created** (15% chance)
   - **Fix**: Run `npm run db:seed`

3. **Database connection failed** (5% chance)
   - **Fix**: Check `DATABASE_URL` in `.env` file

---

## Next Steps

1. **Check** if database tables exist in Supabase
2. **Run** the seed script: `npm run db:seed`
3. **Check** server logs for specific error messages
4. **Verify** environment variables are set correctly

Let me know what you find!

