# Test Login Credentials

## First: Run the Seed Script

Before you can log in, you need to create the test data in your database:

```bash
npm run db:seed
```

This will create:
- A demo tenant
- A test admin user
- Sample communities, buildings, and units
- Default settings (component statuses, quality statuses, room templates, etc.)

---

## Test Login Credentials

After running the seed script, use these credentials:

### Tenant Slug
```
demo
```

### Email
```
admin@demo.com
```

### Password
```
demo123
```

---

## How to Log In

1. **Go to** your application: `http://localhost:3000` (local) or your Vercel URL
2. **Enter**:
   - **Tenant**: `demo`
   - **Email**: `admin@demo.com`
   - **Password**: `demo123`
3. **Click** "Sign In"

---

## What You'll See After Login

The seed script creates:
- ✅ 3 Communities (Sunset Villas, Oakwood Apartments, Riverside Commons)
- ✅ 9 Buildings (3 per community)
- ✅ 90 Units (10 per building)
- ✅ Default component statuses (Keep, Replace, Repair, Remove, Review)
- ✅ Default quality statuses (Excellent, Great, Fair, Poor)
- ✅ Default room templates (All Rooms, Foyer, Living Room, Kitchen, etc.)
- ✅ Component categories and components (Appliances, Plumbing, Electrical, etc.)

---

## If Seed Script Fails

If you get an error running the seed script:

1. **Make sure database schema is created**:
   - Check Supabase Table Editor to see if tables exist
   - If not, run the schema SQL script first

2. **Check database connection**:
   - Verify `.env` file has correct `DATABASE_URL`
   - Test connection: `npx prisma studio`

3. **Run seed again**:
   ```bash
   npm run db:seed
   ```

---

## Creating Your Own User

If you want to create a different user:

1. **Log in** with the demo credentials above
2. **Go to** Users page (if available)
3. **Create** a new user
4. **Or** use Prisma Studio:
   ```bash
   npx prisma studio
   ```
   - Navigate to User table
   - Create a new user (password needs to be hashed with bcrypt)

---

## Quick Test

Run this to verify the seed worked:

```bash
# Run the seed script
npm run db:seed

# Check if it worked
npx prisma studio
```

In Prisma Studio, you should see:
- ✅ Tenant table with "demo" tenant
- ✅ User table with "admin@demo.com" user
- ✅ Community table with 3 communities
- ✅ Building table with 9 buildings
- ✅ Unit table with 90 units

