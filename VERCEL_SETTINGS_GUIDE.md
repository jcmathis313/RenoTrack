# How to Check Vercel Project Settings

## Step-by-Step Guide

### 1. Access Your Vercel Dashboard
- Go to: https://vercel.com/dashboard
- Sign in if needed

### 2. Navigate to Your Project
- Find your project in the list (might be named "renotrack", "RenoTrack", or "renotrack1")
- Click on the project name to open it

### 3. Go to Project Settings
- Look for the **Settings** tab in the top navigation bar
- Click on **Settings**

### 4. Check Git Repository Connection
- In the Settings page, look for the **Git** section
- This will show:
  - **Repository**: The connected GitHub repository (e.g., `jcmathis313/RenoTrack` or `jcmathis313/renotrack1`)
  - **Production Branch**: Usually `main` or `master`
  - **Framework Preset**: Should be Next.js

### 5. If the Repository is Wrong
If it shows `renotrack1` instead of `RenoTrack`:

#### Option A: Disconnect and Reconnect
1. Scroll down to the **Git** section
2. Click **Disconnect** (or **Change Repository**)
3. Click **Connect Git Repository**
4. Select **GitHub**
5. Search for and select `RenoTrack`
6. Select the `main` branch
7. Click **Connect**

#### Option B: Create a New Project (Easier)
1. Go back to your Vercel dashboard
2. Click **Add New Project**
3. Import from GitHub
4. Select `RenoTrack` (not `renotrack1`)
5. Configure as before
6. Delete the old project if needed

## Visual Guide

```
Vercel Dashboard
  └── Your Project
       └── Settings (Top Navigation)
            └── Git Section
                 ├── Repository: jcmathis313/RenoTrack ← Check this
                 ├── Production Branch: main
                 └── Framework Preset: Next.js
```

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Settings Documentation**: https://vercel.com/docs/projects/configure-a-project

## Alternative: Check via Project Overview

You can also see the repository connection in the project overview:
1. Go to your project
2. Look at the top of the page
3. You'll see the repository name next to the project name
4. Click on it to see repository details

## Troubleshooting

**If you can't find Settings:**
- Make sure you're the project owner (not just a collaborator)
- Check that you're logged into the correct Vercel account

**If the repository is correct but build fails:**
- Check that you're deploying from the `main` branch
- Verify the latest commit is pushed to GitHub
- Try manually triggering a redeploy

