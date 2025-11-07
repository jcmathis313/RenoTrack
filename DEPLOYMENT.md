# Deployment Guide - RenoTrack

This guide will walk you through deploying RenoTrack to GitHub, Vercel, and Supabase.

## Prerequisites

1. A GitHub account
2. A Vercel account (free tier available)
3. A Supabase account (free tier available)

## Step 1: Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be created (this may take a few minutes)
3. Once created, go to **Settings** > **Database**
4. Find the **Connection string** section and copy the **Connection pooling** URI (it should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true`)
5. Also note your database password from the project settings

## Step 2: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - RenoTrack application"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR-USERNAME/renotrack.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `renotrack` (or your preferred name)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL
5. Follow the commands in Step 2 to push your code

## Step 4: Set Up Vercel Deployment

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string from Step 1
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate a random string (you can use: `openssl rand -base64 32`)

6. Click **Deploy**

## Step 5: Run Database Migrations

After your first deployment, you need to run Prisma migrations to set up your database schema:

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project
2. Click on **SQL Editor**
3. Run Prisma migrations manually or use the Prisma Migrate command

### Option B: Using Prisma Migrate (Local)

1. Update your local `.env` file with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```

2. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Option C: Using Prisma DB Push (Quick Setup)

```bash
# Set your DATABASE_URL in .env
npx prisma db push
```

## Step 6: Seed Initial Data (Optional)

If you have a seed file, you can run it to populate initial data:

```bash
# Set DATABASE_URL in .env to your Supabase connection string
npm run db:seed
```

## Step 7: Set Up File Storage for Images (Supabase Storage)

For storing community logos and inspection images:

1. Go to your Supabase project
2. Navigate to **Storage**
3. Create buckets:
   - `communities` - for community logos
   - `inspections` - for inspection images
4. Set bucket policies to allow authenticated users to upload files

## Step 8: Update File Upload Code (If Needed)

If you're using local file storage, you may need to update the code to use Supabase Storage instead. The current implementation uses local file system which won't work on Vercel's serverless functions.

## Environment Variables Reference

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string from Supabase
- `NEXTAUTH_URL`: Your application URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`: A random secret for NextAuth session encryption

### Optional Variables

- `NODE_ENV`: Set to `production` in production

## Troubleshooting

### Database Connection Issues

- Ensure your Supabase connection string uses connection pooling
- Check that your IP is allowed in Supabase (or use connection pooling which handles this)
- Verify your database password is correct

### Build Errors

- Ensure `prisma generate` runs before `next build`
- Check that all environment variables are set in Vercel
- Verify Prisma schema is compatible with PostgreSQL

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set and consistent
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure session strategy is set to JWT (already configured)

### File Upload Issues

- Vercel serverless functions don't support persistent file storage
- Consider using Supabase Storage or another cloud storage service
- Update file upload endpoints to use cloud storage

## Next Steps

1. Set up custom domain (optional) in Vercel settings
2. Configure Supabase Storage for file uploads
3. Set up monitoring and error tracking
4. Configure automated backups for Supabase database

## Support

For issues or questions:
- Vercel: [Vercel Documentation](https://vercel.com/docs)
- Supabase: [Supabase Documentation](https://supabase.com/docs)
- Prisma: [Prisma Documentation](https://www.prisma.io/docs)

