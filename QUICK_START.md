# Quick Start - Deploy to Production

Follow these steps to deploy RenoTrack to Vercel and Supabase:

## 1. Create Supabase Project

1. Go to https://supabase.com and create an account
2. Click "New Project"
3. Fill in project details:
   - Name: `renotrack` (or your choice)
   - Database Password: **Save this password!**
   - Region: Choose closest to your users
4. Wait for project creation (2-3 minutes)

## 2. Get Database Connection String

1. In Supabase dashboard, go to **Settings** > **Database**
2. Scroll to **Connection string** section
3. Copy the **Connection pooling** URI (starts with `postgresql://postgres:...`)
4. Replace `[YOUR-PASSWORD]` with your database password

## 3. Create GitHub Repository

1. Go to https://github.com and create a new repository
2. Name it `renotrack` (or your choice)
3. **Don't** initialize with README/gitignore (we have these)

## 4. Push Code to GitHub

```bash
# In your project directory
git remote add origin https://github.com/YOUR-USERNAME/renotrack.git
git branch -M main
git push -u origin main
```

## 5. Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`
5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string from step 2
   - `NEXTAUTH_URL`: Will be set automatically (or use `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` to generate
6. Click "Deploy"

## 6. Set Up Database Schema

After first deployment, run migrations:

```bash
# Option 1: Using Prisma Migrate (Recommended)
# Update your local .env with Supabase DATABASE_URL
npx prisma migrate dev --name init

# Option 2: Using Prisma DB Push (Faster, for quick setup)
npx prisma db push
```

## 7. Verify Deployment

1. Visit your Vercel deployment URL
2. Try logging in (create a user first via seed or manually)
3. Test the application functionality

## Important Notes

- **File Uploads**: Current file uploads use local file system, which won't work on Vercel. You'll need to migrate to Supabase Storage (see DEPLOYMENT.md)
- **Puppeteer/PDF Export**: May require additional configuration on Vercel
- **Environment Variables**: Keep `NEXTAUTH_SECRET` secure and consistent

## Troubleshooting

- **Database Connection**: Ensure connection string uses connection pooling
- **Build Errors**: Check that Prisma generates before build
- **Authentication**: Verify NEXTAUTH_SECRET is set correctly

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

