# Development Workflow Guide

## Overview

This guide outlines the recommended development workflow using three environments:
1. **Local Development** (`localhost`) - For rapid iteration
2. **Staging** (Vercel Preview/Staging) - For testing before production
3. **Production** (Vercel Production) - Live application

## Environment Setup

### 1. Local Development (localhost)

**Purpose**: Fast development and debugging

**Configuration**:
- Uses local database (or Supabase dev database)
- Runs on `http://localhost:3000` (or available port)
- Hot reload enabled
- Detailed error messages

**Environment Variables** (`.env.local`):
```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://... (local or dev Supabase)
NEXTAUTH_SECRET=your-dev-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Usage**:
```bash
npm run dev
```

### 2. Staging Environment (Vercel Preview)

**Purpose**: Test features in a production-like environment before deploying to production

**Setup**:
1. **Create a Staging Branch**:
   ```bash
   git checkout -b staging
   git push -u origin staging
   ```

2. **Configure Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Git
   - Add a new branch: `staging`
   - Vercel will automatically create preview deployments for this branch

3. **Set Staging Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add variables for "Preview" environment:
     - `NEXTAUTH_URL` = Your staging URL (e.g., `https://your-app-staging.vercel.app`)
     - `DATABASE_URL` = Staging Supabase database (or separate dev database)
     - `NEXTAUTH_SECRET` = Staging-specific secret
     - `SUPABASE_URL` = Staging Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = Staging Supabase service role key

**Benefits**:
- ✅ Tests in production-like environment
- ✅ Catches issues before production
- ✅ Safe to test with real data
- ✅ Shareable preview URLs for stakeholders

### 3. Production Environment (Vercel Production)

**Purpose**: Live application for end users

**Setup**:
- Connected to `main` branch
- Production environment variables set in Vercel
- Production Supabase database

## Recommended Workflow

### Daily Development

1. **Work on Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop Locally**:
   - Make changes
   - Test on `localhost`
   - Fix issues as you go

3. **Test on Staging**:
   ```bash
   git push origin feature/your-feature-name
   ```
   - Vercel creates a preview deployment
   - Test the preview URL
   - Share with team for review

4. **Merge to Staging**:
   ```bash
   git checkout staging
   git merge feature/your-feature-name
   git push origin staging
   ```
   - Vercel deploys to staging environment
   - Full testing in staging environment
   - Test PDF exports, authentication, etc.

5. **Deploy to Production**:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```
   - Vercel deploys to production
   - Monitor for issues

### Branch Strategy

```
main (production)
  └── staging (staging environment)
      └── feature/* (feature branches)
      └── bugfix/* (bug fix branches)
```

## Environment-Specific Configurations

### PDF Export Configuration

The PDF export route automatically detects the environment:

- **Development**: Uses local Puppeteer with system Chrome
- **Staging/Production**: Uses `@sparticuz/chromium` for serverless

### Authentication Configuration

- **Development**: `NEXTAUTH_URL=http://localhost:3000`
- **Staging**: `NEXTAUTH_URL=https://your-app-staging.vercel.app`
- **Production**: `NEXTAUTH_URL=https://your-app.vercel.app`

### Database Configuration

**Option 1: Separate Databases** (Recommended)
- Local: Local PostgreSQL or Supabase dev project
- Staging: Separate Supabase project or database
- Production: Production Supabase project

**Option 2: Shared Dev Database**
- Local & Staging: Same Supabase dev project
- Production: Production Supabase project

## Testing Checklist

Before merging to staging:
- [ ] Code works on localhost
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] All features tested locally

Before deploying to production:
- [ ] Tested on staging environment
- [ ] PDF exports work on staging
- [ ] Authentication works on staging
- [ ] Database migrations tested
- [ ] Environment variables verified
- [ ] No breaking changes

## Troubleshooting

### PDF Export Issues

**Localhost**:
- Check that Chrome/Chromium is installed
- Verify cookies are being set correctly
- Check browser console for errors

**Staging/Production**:
- Verify `@sparticuz/chromium` is installed
- Check Vercel function logs
- Verify environment variables are set

### Authentication Issues

**Localhost**:
- Verify `NEXTAUTH_URL` matches your local URL
- Check cookie settings in browser
- Verify `NEXTAUTH_SECRET` is set

**Staging/Production**:
- Verify `NEXTAUTH_URL` matches deployment URL
- Check Vercel environment variables
- Verify cookies work across domains

## Quick Commands

```bash
# Start local development
npm run dev

# Run database migrations
npm run db:push

# Generate Prisma client
npm run db:generate

# Build for production
npm run build

# Test production build locally
npm run build && npm start
```

## Best Practices

1. **Always test on staging before production**
2. **Use feature branches for all changes**
3. **Keep staging branch close to main**
4. **Test PDF exports in staging (they behave differently than localhost)**
5. **Monitor Vercel logs for staging and production**
6. **Use separate Supabase projects for staging and production**
7. **Document environment-specific issues**

## Vercel Preview Deployments

Every push to a branch creates a preview deployment:
- Preview URL: `https://your-app-git-branch-name.vercel.app`
- Automatic deployments
- Shareable URLs
- Perfect for testing before merging

## Next Steps

1. Create a `staging` branch
2. Configure Vercel to deploy staging branch
3. Set up staging environment variables
4. Test the workflow with a small change
5. Document any environment-specific quirks

