# Vercel Deployment Guide

## Quick Deployment Steps

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository**: Select `RenoTrack` from the list
5. **Configure the project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `prisma generate && next build` (already set in vercel.json)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

## Environment Variables

Click **Environment Variables** and add the following:

### Required Variables

1. **DATABASE_URL**
   - Get this from Supabase Dashboard > Settings > Database
   - Use the **Connection pooling** URI
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Replace `[PASSWORD]` with your database password

2. **NEXTAUTH_URL**
   - Set this to your Vercel deployment URL
   - Format: `https://your-app-name.vercel.app`
   - Vercel will provide this after first deployment
   - You can update it after deployment

3. **NEXTAUTH_SECRET**
   - Generate a random secret: `openssl rand -base64 32`
   - Or use this online generator: https://generate-secret.vercel.app/32
   - **Important**: Keep this secret secure and consistent

### Optional Variables (for future Supabase Storage integration)

4. **SUPABASE_URL**
   - Value: `https://xadicwbmvqktzlkrxxnb.supabase.co`

5. **SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZGljd2JtdnFrdHpsa3J4eG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI5MjYsImV4cCI6MjA3ODA4ODkyNn0.sPcS7Xd6M1kQjhumd-jhJoPrnPPJXgQfVqzOw0CbxVY`

## Deploy

1. Click **Deploy**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, you'll get a URL like: `https://renotrack-xxx.vercel.app`

## After Deployment

### 1. Update NEXTAUTH_URL

1. Go to **Settings** > **Environment Variables**
2. Update `NEXTAUTH_URL` with your actual deployment URL
3. Redeploy if needed

### 2. Set Up Database Schema

After first deployment, you need to run database migrations:

**Option A: Using Prisma Studio (Recommended for initial setup)**

1. Update your local `.env` with Supabase connection string
2. Run: `npx prisma db push`
3. Or create migration: `npx prisma migrate dev --name init`

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### 3. Seed Initial Data (Optional)

If you have seed data:
```bash
# Update local .env with Supabase DATABASE_URL
npm run db:seed
```

## Troubleshooting

### Build Fails

- Check that `DATABASE_URL` is set correctly
- Verify Prisma generates before build (should be in build command)
- Check build logs in Vercel dashboard

### Database Connection Errors

- Ensure you're using **Connection pooling** URI for serverless functions
- Check that your database password is correct
- Verify your IP isn't blocked (connection pooling should handle this)

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure session strategy is JWT (already configured)

### File Upload Issues

- Current implementation uses local file storage
- This won't work on Vercel serverless functions
- Need to migrate to Supabase Storage (future update)

## Next Steps

1. ✅ Code pushed to GitHub
2. ⏳ Deploy to Vercel
3. ⏳ Set up database schema
4. ⏳ Test deployment
5. ⏳ Configure custom domain (optional)

## Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb
- GitHub Repository: https://github.com/jcmathis313/RenoTrack

