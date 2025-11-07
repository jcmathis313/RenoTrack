# Supabase Setup Instructions

## Your Supabase Project Details

- **Project URL**: https://xadicwbmvqktzlkrxxnb.supabase.co
- **Project Reference**: `xadicwbmvqktzlkrxxnb`
- **API Key (Anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZGljd2JtdnFrdHpsa3J4eG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI5MjYsImV4cCI6MjA3ODA4ODkyNn0.sPcS7Xd6M1kQjhumd-jhJoPrnPPJXgQfVqzOw0CbxVY`

## Getting Your Database Connection String

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xadicwbmvqktzlkrxxnb
2. Navigate to **Settings** > **Database**
3. Scroll to **Connection string** section
4. Select **Connection pooling** mode (for serverless functions)
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
6. Replace `[YOUR-PASSWORD]` with your database password (set when creating the project)

## Alternative: Direct Connection String

If connection pooling doesn't work, use the **Session** mode connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xadicwbmvqktzlkrxxnb.supabase.co:5432/postgres
```

## Database Password

If you forgot your database password:
1. Go to **Settings** > **Database**
2. Click **Reset database password**
3. Save the new password securely

## Setting Up Database Schema

Once you have your connection string, update your `.env` file:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Then run:
```bash
npx prisma db push
```

Or create a migration:
```bash
npx prisma migrate dev --name init
```

## Setting Up Storage Buckets (for file uploads)

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:
   - `communities` - Public bucket for community logos
   - `inspections` - Public bucket for inspection images
3. For each bucket:
   - Set to **Public**
   - Add policy: Allow authenticated users to upload/read files

## Environment Variables for Vercel

When deploying to Vercel, you'll need:

- `DATABASE_URL`: Your connection string (from above)
- `NEXTAUTH_URL`: Your Vercel deployment URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `SUPABASE_URL`: `https://xadicwbmvqktzlkrxxnb.supabase.co`
- `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZGljd2JtdnFrdHpsa3J4eG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI5MjYsImV4cCI6MjA3ODA4ODkyNn0.sPcS7Xd6M1kQjhumd-jhJoPrnPPJXgQfVqzOw0CbxVY`

