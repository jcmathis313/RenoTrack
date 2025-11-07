# How to Verify Supabase Setup

## ✅ Step 1: Verify Database Schema

### Check in Supabase Dashboard:

1. **Go to Table Editor**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
2. **Look for these tables** in the left sidebar:
   - ✅ `Tenant`
   - ✅ `User`
   - ✅ `Community`
   - ✅ `Building`
   - ✅ `Unit`
   - ✅ `Assessment`
   - ✅ `Room`
   - ✅ `ComponentAssessment`
   - ✅ `DesignProject`
   - ✅ `DesignRoom`
   - ✅ `DesignComponent`
   - ✅ `CatalogItem`
   - ✅ `ComponentCategory`
   - ✅ `Component`
   - ✅ `ComponentStatus`
   - ✅ `QualityStatus`
   - ✅ `RoomTemplate`
   - ✅ `TenantSettings`
   - ✅ `Inspection`
   - ✅ `InspectionRoom`
   - ✅ `InspectionComponent`

**If you see all these tables** → ✅ Database schema is created!

**If tables are missing** → Run the SQL script again in SQL Editor

---

## ✅ Step 2: Verify Storage Buckets

### Check in Supabase Dashboard:

1. **Go to Storage**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
2. **Look for these buckets**:
   - ✅ `communities` (should be Public)
   - ✅ `inspections` (should be Public)

**If you see both buckets** → ✅ Storage is set up!

**If buckets are missing** → Run the buckets SQL script again

---

## ✅ Step 3: Verify Database Connection (Local)

### Test from your local machine:

1. **Check your `.env` file**:
   ```bash
   cat .env
   ```
   Should show:
   ```
   DATABASE_URL="postgresql://postgres:bTU0XoHzBE7hpGfx@db.blglwhbkoxbmcinmswoo.supabase.co:5432/postgres"
   ```

2. **Try to generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
   Should complete successfully ✅

3. **Try to connect** (optional):
   ```bash
   npx prisma studio
   ```
   This opens a browser at http://localhost:5555
   - If it connects, you should see all your tables
   - If it fails, there might be a connection issue

---

## ✅ Step 4: Verify Vercel Environment Variables

### Check in Vercel Dashboard:

1. **Go to**: https://vercel.com/dashboard
2. **Select** your RenoTrack project
3. **Go to**: Settings → Environment Variables
4. **Verify** these variables are set:
   - ✅ `DATABASE_URL` (should have your connection string)
   - ✅ `NEXTAUTH_SECRET` (should have a secret value)
   - ✅ `NEXTAUTH_URL` (can be empty initially)
   - ✅ `SUPABASE_URL` (optional)
   - ✅ `SUPABASE_ANON_KEY` (optional)

**If all variables are set** → ✅ Vercel is configured!

---

## ✅ Step 5: Verify Vercel Deployment

### Check Vercel Build Logs:

1. **Go to**: https://vercel.com/dashboard
2. **Select** your project
3. **Go to**: Deployments tab
4. **Click** on the latest deployment
5. **Check** the build logs for:
   - ✅ "Prisma Client generated successfully"
   - ✅ "Compiled successfully"
   - ✅ No database connection errors
   - ✅ Build completes successfully

**If build succeeds** → ✅ Deployment is working!

**If build fails**:
   - Check the error message
   - Verify environment variables are set correctly
   - Make sure `DATABASE_URL` is correct

---

## ✅ Step 6: Verify Application Works

### Test the deployed application:

1. **Visit** your Vercel URL: `https://your-project.vercel.app`
2. **Try to**:
   - Load the homepage ✅
   - Access the login page ✅
   - Sign up or log in ✅
   - Create a tenant/community ✅

**If the app loads and you can log in** → ✅ Everything is working!

---

## 🧪 Quick Test Script

Run this to test the connection locally:

```bash
# Test Prisma connection
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Tenant\";"
```

If this works, your database connection is good!

---

## ❌ Common Issues

### "Can't reach database server"
- Check if `DATABASE_URL` is correct
- Verify password is correct: `bTU0XoHzBE7hpGfx`
- Check if your IP is whitelisted in Supabase

### "Table does not exist"
- Run the database schema SQL script again
- Check SQL Editor for any errors

### "Bucket does not exist"
- Run the storage buckets SQL script again
- Check bucket names: `communities` and `inspections`

### "Build fails on Vercel"
- Verify `DATABASE_URL` is set in Vercel
- Check that it uses the correct connection string
- Make sure all environment variables are set

---

## 📋 Complete Checklist

- [ ] Database tables created (check Table Editor)
- [ ] Storage buckets created (check Storage page)
- [ ] `.env` file has correct `DATABASE_URL`
- [ ] Vercel environment variables are set
- [ ] Vercel build succeeds
- [ ] Application loads on Vercel
- [ ] Can log in to the application
- [ ] Can create data (tenant, community, etc.)

---

## 🎯 What to Check Right Now

1. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/editor
   - Do you see the tables? ✅ or ❌

2. **Go to**: https://supabase.com/dashboard/project/blglwhbkoxbmcinmswoo/storage/buckets
   - Do you see `communities` and `inspections`? ✅ or ❌

3. **Check Vercel**: https://vercel.com/dashboard
   - Is the latest deployment successful? ✅ or ❌

Let me know what you see!

