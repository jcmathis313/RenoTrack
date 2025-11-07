# Fresh Vercel Deployment - Step by Step

## Prerequisites Checklist

Before creating a new Vercel project, make sure you have:

- ✅ Code pushed to GitHub: `https://github.com/jcmathis313/RenoTrack.git`
- ✅ Supabase project created: `https://xadicwbmvqktzlkrxxnb.supabase.co`
- ✅ Database connection string from Supabase
- ✅ NEXTAUTH_SECRET ready (generated: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`)

## Step 1: Get Your Supabase Database Connection String

1. Go to: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb/settings/database
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

Example format:
```
postgresql://postgres.xadicwbmvqktzlkrxxnb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Save this connection string** - you'll need it in Step 4.

## Step 2: Delete Old Vercel Project (If It Exists)

1. Go to: https://vercel.com/dashboard
2. Find your old project (might be "renotrack", "renotrack1", etc.)
3. Click on the project
4. Go to **Settings** → **General**
5. Scroll to bottom and click **Delete Project**
6. Confirm deletion

## Step 3: Create New Vercel Project

1. Go to: https://vercel.com/new
2. Sign in with GitHub (if not already signed in)
3. You'll see a list of your GitHub repositories
4. **Important**: Select `RenoTrack` (not `renotrack1` or any other variation)
5. Click **Import** next to `RenoTrack`

## Step 4: Configure Project Settings

### Framework Preset
- Should auto-detect: **Next.js**
- If not, select it manually

### Root Directory
- Leave as: `./` (default)

### Build and Output Settings
- **Build Command**: `prisma generate && next build` (already configured in vercel.json)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Environment Variables

Click **Environment Variables** and add the following:

#### 1. DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Your Supabase connection string from Step 1
- **Environment**: Production, Preview, Development (select all three)

#### 2. NEXTAUTH_URL
- **Key**: `NEXTAUTH_URL`
- **Value**: Leave empty for now (we'll update after deployment)
- **Environment**: Production, Preview, Development

#### 3. NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`
- **Environment**: Production, Preview, Development (select all three)

#### 4. (Optional) SUPABASE_URL
- **Key**: `SUPABASE_URL`
- **Value**: `https://xadicwbmvqktzlkrxxnb.supabase.co`
- **Environment**: Production, Preview, Development

#### 5. (Optional) SUPABASE_ANON_KEY
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZGljd2JtdnFrdHpsa3J4eG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI5MjYsImV4cCI6MjA3ODA4ODkyNn0.sPcS7Xd6M1kQjhumd-jhJoPrnPPJXgQfVqzOw0CbxVY`
- **Environment**: Production, Preview, Development

## Step 5: Deploy

1. Click **Deploy** button
2. Wait for build to complete (2-5 minutes)
3. You'll get a deployment URL like: `https://renotrack-xxx.vercel.app`

## Step 6: Update NEXTAUTH_URL

After deployment:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL`
4. Click **Edit**
5. Update value to your deployment URL: `https://your-project-name.vercel.app`
6. Click **Save**
7. **Redeploy** the project (go to Deployments → click "..." → Redeploy)

## Step 7: Set Up Database Schema

After first deployment, run database migrations:

### Option A: Using Prisma DB Push (Quick)

1. Update your local `.env` file with Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres.xadicwbmvqktzlkrxxnb:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. Run:
   ```bash
   npx prisma db push
   ```

### Option B: Using Prisma Migrate (Recommended for Production)

```bash
# Update local .env with Supabase connection string
npx prisma migrate dev --name init
```

## Step 8: Test Deployment

1. Visit your Vercel deployment URL
2. Test the login page
3. Create a test tenant and user
4. Verify the application works

## Important Notes

### File Uploads
⚠️ **Current Limitation**: File uploads use local file storage which won't work on Vercel serverless functions. You'll need to migrate to Supabase Storage in the future.

### PDF Export
⚠️ **Puppeteer Limitation**: PDF export may require additional Vercel configuration. The function timeout is set to 60 seconds in `vercel.json`.

### Database Connection
- Always use **Connection pooling** URI for serverless functions
- Don't use direct connection strings (they won't work with connection limits)

## Troubleshooting

### Build Fails
- Check that `DATABASE_URL` is set correctly
- Verify Prisma generates before build
- Check build logs in Vercel dashboard

### Database Connection Errors
- Ensure connection string uses connection pooling
- Verify database password is correct
- Check Supabase project is active

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches deployment URL
- Ensure environment variables are set for all environments

## Quick Reference

- **GitHub Repository**: https://github.com/jcmathis313/RenoTrack
- **Supabase Dashboard**: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb
- **Vercel Dashboard**: https://vercel.com/dashboard
- **NEXTAUTH_SECRET**: `VmkSVkYERL9013tQBWSg0JokwM8e8z8KifyMC5PSCys=`

## Next Steps After Deployment

1. ✅ Set up database schema
2. ✅ Test authentication
3. ✅ Create test data
4. ⏳ Migrate file uploads to Supabase Storage
5. ⏳ Configure custom domain (optional)
6. ⏳ Set up monitoring and error tracking

