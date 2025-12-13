# Admin Panel Setup Guide

This guide will help you set up the admin panel for TurnTrack, which allows you (the SaaS owner) to view and manage all tenants, users, communities, and other data across the entire platform.

## Features

The admin panel provides:
- **Overview Dashboard**: System-wide statistics and metrics
- **Tenant Management**: View all organizations and their data
- **User Management**: View all users across all tenants with filtering
- **Community Management**: View all communities across all tenants

## Setup Instructions

### 1. Generate Admin Password Hash

First, generate a secure password hash for your super admin account:

```bash
npm run generate-admin-password -- "your-secure-password-here"
```

Or using tsx directly:

```bash
tsx scripts/generate-admin-password.ts "your-secure-password-here"
```

This will output a bcrypt hash that you'll use in your environment variables.

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file (or your hosting platform's environment variable settings):

```env
# Super Admin Configuration
SUPER_ADMIN_EMAILS="your-email@example.com"
SUPER_ADMIN_PASSWORD="<generated-hash-from-step-1>"

# Existing NextAuth secret (if not already set)
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

**Important Notes:**
- `SUPER_ADMIN_EMAILS`: Comma-separated list of email addresses that can access the admin panel
- `SUPER_ADMIN_PASSWORD`: The bcrypt hash generated in step 1 (NOT the plain text password)
- For multiple admin emails: `SUPER_ADMIN_EMAILS="admin1@example.com,admin2@example.com"`

### 3. Access the Admin Panel

1. Navigate to `/admin/login` on your application
2. Enter your email (from `SUPER_ADMIN_EMAILS`)
3. Enter your password (the plain text password you used to generate the hash)
4. You'll be redirected to the admin dashboard

**Important:** The admin login is separate from regular tenant login. Regular users cannot access the admin panel even if they're marked as "Admin" in their tenant.

## Admin Panel Routes

- `/admin` - Overview dashboard with system statistics
- `/admin/tenants` - List all tenants/organizations
- `/admin/users` - List all users across tenants (with filtering)
- `/admin/communities` - List all communities across tenants (with filtering)

## Security Considerations

1. **Never commit passwords or hashes to version control**
   - Add `.env` to your `.gitignore` if not already present
   - Use environment variables in your hosting platform

2. **Use strong passwords**
   - Minimum 8 characters (recommended: 16+)
   - Mix of uppercase, lowercase, numbers, and special characters

3. **Limit super admin emails**
   - Only add email addresses you trust
   - Remove access when no longer needed

4. **Regular security audits**
   - Review who has admin access periodically
   - Rotate passwords regularly

## Troubleshooting

### "Super admin not configured" error
- Make sure `SUPER_ADMIN_EMAILS` and `SUPER_ADMIN_PASSWORD` are set in your environment variables
- Restart your application after adding environment variables

### "Invalid credentials" error
- Verify your email is in the `SUPER_ADMIN_EMAILS` list (case-sensitive)
- Make sure you're using the plain text password (not the hash) to login
- Verify the hash in `SUPER_ADMIN_PASSWORD` matches the password you're using

### Cannot access `/admin` routes
- Check that you're logged in as a super admin (check session)
- Verify middleware is correctly configured
- Check browser console for any errors

### Password hash not working
- Make sure you copied the entire hash (it's long, ~60 characters)
- Ensure there are no extra spaces or quotes in the hash
- Try regenerating the hash if needed

## API Routes

The admin panel uses the following API routes (all require super admin authentication):

- `GET /api/admin/stats` - Get system-wide statistics
- `GET /api/admin/tenants` - Get all tenants
- `GET /api/admin/users?tenantId=<id>` - Get all users (optionally filtered by tenant)
- `GET /api/admin/communities?tenantId=<id>` - Get all communities (optionally filtered by tenant)

## Development

To test the admin panel locally:

1. Set up environment variables in `.env.local`
2. Generate a password hash using the script
3. Run the development server: `npm run dev`
4. Navigate to `http://localhost:3000/admin/login`

## Production Deployment

When deploying to production:

1. Add environment variables to your hosting platform (Vercel, Railway, etc.)
2. Never commit `.env` files
3. Use platform-specific secret management features
4. Consider using different admin emails for staging vs production

## Future Enhancements

Potential features to add:
- Tenant creation/deletion
- User management (create, edit, delete)
- Data export functionality
- Activity logs and audit trails
- System health monitoring
- Billing/subscription management



