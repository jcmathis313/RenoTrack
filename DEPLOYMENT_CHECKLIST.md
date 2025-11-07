# Deployment Checklist

## ✅ Completed Steps

- [x] Updated Prisma schema to PostgreSQL
- [x] Created Vercel configuration
- [x] Created deployment documentation
- [x] Pushed code to GitHub: https://github.com/jcmathis313/RenoTrack.git

## 🔄 Next Steps

### Step 1: Get Supabase Database Connection String

1. Go to: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb/settings/database
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. **Save this connection string** - you'll need it for Vercel

The connection string should look like:
```
postgresql://postgres.xadicwbmvqktzlkrxxnb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 2: Deploy to Vercel

1. Go to: https://vercel.com/new
2. Sign in with GitHub
3. Import repository: `RenoTrack`
4. Configure project:
   - Build Command: `prisma generate && next build` (already set)
   - Output Directory: `.next`
5. Add Environment Variables:

   **DATABASE_URL**
   - Value: Your connection string from Step 1
   
   **NEXTAUTH_SECRET**
   - Generate: Run `openssl rand -base64 32` in terminal
   - Or use: [Online Generator](https://generate-secret.vercel.app/32)
   
   **NEXTAUTH_URL**
   - Set to: `https://your-app-name.vercel.app` (update after first deployment)

6. Click **Deploy**
7. Wait for build to complete (2-5 minutes)

### Step 3: Update NEXTAUTH_URL

After first deployment:
1. Get your Vercel deployment URL
2. Go to Vercel project settings
3. Update `NEXTAUTH_URL` environment variable
4. Redeploy if needed

### Step 4: Set Up Database Schema

After deployment, run database migrations:

```bash
# Update your local .env file with Supabase connection string
DATABASE_URL="postgresql://postgres.xadicwbmvqktzlkrxxnb:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

### Step 5: Test Deployment

1. Visit your Vercel deployment URL
2. Test login functionality
3. Create a test tenant and user
4. Verify database connectivity

## 📝 Important Notes

### Database Password

If you forgot your Supabase database password:
1. Go to: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb/settings/database
2. Click **Reset database password**
3. Save the new password securely

### File Uploads

⚠️ **Current Limitation**: File uploads use local file storage which won't work on Vercel serverless functions. You'll need to:
- Migrate to Supabase Storage (future update)
- Or use another cloud storage service

### PDF Export

⚠️ **Puppeteer Limitation**: PDF export using Puppeteer may require additional configuration on Vercel. Consider:
- Using Vercel's serverless functions with increased timeout
- Or migrating to a different PDF generation service

## 🔗 Quick Links

- **GitHub Repository**: https://github.com/jcmathis313/RenoTrack
- **Supabase Dashboard**: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Database Settings**: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb/settings/database

## 📚 Documentation

- Full deployment guide: See `DEPLOYMENT.md`
- Quick start: See `QUICK_START.md`
- Supabase setup: See `SUPABASE_SETUP.md`
- Vercel deployment: See `VERCEL_DEPLOY.md`

