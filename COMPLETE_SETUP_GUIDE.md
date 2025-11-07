# Complete Setup Guide - Supabase + Vercel

Follow these steps in order to set up your RenoTrack application from scratch.

## Part 1: Set Up Supabase Database

### Step 1.1: Create Supabase Account and Project

1. Go to: https://supabase.com
2. Click **Sign Up** (or **Sign In** if you have an account)
3. Sign in with GitHub (recommended) or email

### Step 1.2: Create New Project

1. Click **New Project** (green button)
2. Fill in project details:
   - **Name**: `renotrack` (or your preferred name)
   - **Database Password**: 
     - **IMPORTANT**: Create a strong password and **SAVE IT SECURELY**
     - You'll need this for the connection string
     - Example: Use a password manager or write it down
   - **Region**: Choose closest to your users (e.g., `US East (North Virginia)`)
   - **Pricing Plan**: Free tier is fine to start
3. Click **Create new project**
4. Wait 2-3 minutes for project to be created

### Step 1.3: Get Database Connection String

1. Once project is created, go to: **Settings** → **Database** (left sidebar)
2. Scroll down to **Connection string** section
3. Select **Connection pooling** tab (important for serverless)
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. **Replace `[YOUR-PASSWORD]`** with the database password you created in Step 1.2
6. **Save this complete connection string** - you'll need it for Vercel

Example (after replacing password):
```
postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 1.4: Get Project URL and API Key

1. Still in **Settings** → **API**
2. Find **Project URL** - copy this (looks like: `https://xxxxx.supabase.co`)
3. Find **anon public** key under **Project API keys** - copy this
4. Save both for later (you'll need them for environment variables)

### Step 1.5: Set Up Storage Buckets (For Future File Uploads)

1. Go to **Storage** in the left sidebar
2. Click **Create bucket**
3. Create bucket named `communities`:
   - Name: `communities`
   - Public bucket: **Yes** (toggle on)
   - Click **Create bucket**
4. Create bucket named `inspections`:
   - Name: `inspections`
   - Public bucket: **Yes** (toggle on)
   - Click **Create bucket**

## Part 2: Set Up Vercel Deployment

### Step 2.1: Create Vercel Account

1. Go to: https://vercel.com
2. Click **Sign Up**
3. Sign in with **GitHub** (recommended)
4. Authorize Vercel to access your GitHub repositories

### Step 2.2: Create New Project

1. After signing in, you'll see the dashboard
2. Click **Add New Project** (or **New Project**)
3. You'll see a list of your GitHub repositories
4. **Find and select**: `RenoTrack`
   - If you don't see it, click **Adjust GitHub App Permissions** and authorize access
5. Click **Import** next to `RenoTrack`

### Step 2.3: Configure Project Settings

On the configuration page:

1. **Project Name**: 
   - Default: `renotrack` (or keep as is)
   - You can change it if you want

2. **Framework Preset**:
   - Should auto-detect: **Next.js**
   - If not, select **Next.js** from dropdown

3. **Root Directory**:
   - Leave as: `./` (default)

4. **Build and Output Settings**:
   - **Build Command**: `prisma generate && next build` (already configured)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 2.4: Add Environment Variables

**Before clicking Deploy**, add these environment variables:

1. Click **Environment Variables** section
2. Add each variable one by one:

#### Variable 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Paste your connection string from Step 1.3 (the one with your password)
- **Environment**: Select all three:
  - ✅ Production
  - ✅ Preview  
  - ✅ Development
- Click **Add**

#### Variable 2: NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
- **Environment**: Select all three (Production, Preview, Development)
- Click **Add**

#### Variable 3: NEXTAUTH_URL
- **Key**: `NEXTAUTH_URL`
- **Value**: Leave this empty for now (we'll update after deployment)
- **Environment**: Select all three
- Click **Add**

#### Variable 4: SUPABASE_URL (Optional but Recommended)
- **Key**: `SUPABASE_URL`
- **Value**: Your Project URL from Step 1.4 (e.g., `https://xxxxx.supabase.co`)
- **Environment**: Select all three
- Click **Add**

#### Variable 5: SUPABASE_ANON_KEY (Optional but Recommended)
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: Your anon public key from Step 1.4
- **Environment**: Select all three
- Click **Add**

### Step 2.5: Deploy

1. After adding all environment variables, click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. You'll see build progress in real-time
4. Once complete, you'll get a deployment URL like: `https://renotrack-xxxxx.vercel.app`

### Step 2.6: Update NEXTAUTH_URL

1. After deployment completes, copy your deployment URL
2. Go to your project in Vercel dashboard
3. Click **Settings** → **Environment Variables**
4. Find `NEXTAUTH_URL` and click **Edit** (pencil icon)
5. Update the value to your deployment URL: `https://your-project-name.vercel.app`
6. Click **Save**
7. Go to **Deployments** tab
8. Find the latest deployment
9. Click the **three dots** (⋯) → **Redeploy**
10. Confirm redeploy

## Part 3: Set Up Database Schema

### Step 3.1: Update Local Environment File

1. Open your local project folder
2. Create or update `.env` file with:
   ```env
   DATABASE_URL="your-supabase-connection-string-from-step-1-3"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys="
   ```

### Step 3.2: Push Database Schema to Supabase

1. Open terminal in your project directory
2. Run:
   ```bash
   npx prisma db push
   ```
3. This will create all tables in your Supabase database
4. You should see success messages

### Step 3.3: Verify Database Setup

1. Go back to Supabase dashboard
2. Click **Table Editor** in left sidebar
3. You should see all your tables created:
   - Tenant
   - User
   - Community
   - Building
   - Unit
   - Assessment
   - etc.

## Part 4: Test Your Deployment

### Step 4.1: Visit Your Site

1. Go to your Vercel deployment URL
2. You should see the login page

### Step 4.2: Create Test Data (Optional)

You can create a test tenant and user directly in Supabase:

1. Go to Supabase → **Table Editor**
2. Click on **Tenant** table
3. Click **Insert row**
4. Add:
   - `slug`: `test` (or any slug)
   - `name`: `Test Company`
5. Click **Save**
6. Copy the `id` of the tenant you just created
7. Go to **User** table
8. Click **Insert row**
9. Add:
   - `email`: `test@example.com`
   - `password`: Generate a bcrypt hash (or use a seed script)
   - `tenantId`: The tenant ID you copied
   - `role`: `Admin`

**Note**: For easier setup, you might want to create a seed script or use the Supabase SQL editor to create initial data.

## Troubleshooting

### Build Fails on Vercel
- Check that `DATABASE_URL` is set correctly
- Verify connection string uses connection pooling
- Check build logs in Vercel dashboard

### Database Connection Errors
- Verify database password is correct in connection string
- Check Supabase project is active (not paused)
- Ensure connection string uses `pgbouncer=true`

### Authentication Not Working
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure environment variables are set for Production environment

### Can't See Tables in Supabase
- Run `npx prisma db push` again
- Check for errors in terminal
- Verify `DATABASE_URL` in local `.env` is correct

## Quick Reference

### Supabase
- **Dashboard**: https://supabase.com/dashboard
- **Database Settings**: Settings → Database
- **API Settings**: Settings → API
- **Table Editor**: Table Editor (left sidebar)

### Vercel
- **Dashboard**: https://vercel.com/dashboard
- **Project Settings**: Your Project → Settings
- **Environment Variables**: Settings → Environment Variables
- **Deployments**: Your Project → Deployments

### Important Values to Save

- **Database Password**: (from Step 1.2)
- **Database Connection String**: (from Step 1.3)
- **Supabase Project URL**: (from Step 1.4)
- **Supabase Anon Key**: (from Step 1.4)
- **Vercel Deployment URL**: (from Step 2.5)
- **NEXTAUTH_SECRET**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`

## Next Steps

After successful deployment:
1. ✅ Test login functionality
2. ✅ Create initial tenant and user
3. ✅ Test creating communities, buildings, units
4. ⏳ Set up file uploads with Supabase Storage (future)
5. ⏳ Configure custom domain (optional)

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs

