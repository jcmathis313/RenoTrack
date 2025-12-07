import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Get super admin emails from environment variable (comma-separated)
const getSuperAdminEmails = (): string[] => {
  const emails = process.env.SUPER_ADMIN_EMAILS || ""
  return emails.split(",").map((e) => e.trim()).filter(Boolean)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        tenantSlug: { label: "Tenant", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isAdminLogin: { label: "Admin Login", type: "text" }, // Hidden field for admin login
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const superAdminEmails = getSuperAdminEmails()
        const isSuperAdmin = superAdminEmails.includes(credentials.email)
        const isAdminLogin = credentials.isAdminLogin === "true"

        // Super admin login (bypass tenant requirement)
        if (isSuperAdmin && isAdminLogin) {
          // For super admin, check password against a stored bcrypt hash
          let superAdminPasswordHash = process.env.SUPER_ADMIN_PASSWORD || ""
          
          // Clean up the hash (trim whitespace and remove quotes if present)
          superAdminPasswordHash = superAdminPasswordHash.trim()
          
          // Remove surrounding quotes if present
          if ((superAdminPasswordHash.startsWith('"') && superAdminPasswordHash.endsWith('"')) ||
              (superAdminPasswordHash.startsWith("'") && superAdminPasswordHash.endsWith("'"))) {
            superAdminPasswordHash = superAdminPasswordHash.slice(1, -1).trim()
          }
          
          if (!superAdminPasswordHash) {
            throw new Error("Super admin not configured: SUPER_ADMIN_PASSWORD is empty")
          }

          // Try to decode from base64 if it looks like base64 (starts with a base64 char)
          // This handles cases where $ signs in the hash cause variable expansion issues
          if (superAdminPasswordHash.length > 60 && !superAdminPasswordHash.startsWith('$')) {
            try {
              const decoded = Buffer.from(superAdminPasswordHash, 'base64').toString('utf-8')
              if (decoded.startsWith('$2a$') || decoded.startsWith('$2b$') || decoded.startsWith('$2y$')) {
                superAdminPasswordHash = decoded
              }
            } catch (e) {
              // Not base64, continue with original value
            }
          }

          // Check if the hash looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
          const isBcryptHash = 
            superAdminPasswordHash.startsWith('$2a$') || 
            superAdminPasswordHash.startsWith('$2b$') || 
            superAdminPasswordHash.startsWith('$2y$')
          
          if (!isBcryptHash) {
            // Better error message with diagnostic info
            const firstChars = superAdminPasswordHash.substring(0, 15)
            const charCodes = Array.from(firstChars).map(c => c.charCodeAt(0)).join(',')
            throw new Error(
              `Invalid super admin password hash. Expected hash starting with $2a$, $2b$, or $2y$. ` +
              `Got: "${firstChars}..." (length: ${superAdminPasswordHash.length}, first char codes: ${charCodes}). ` +
              `Make sure the hash in .env is properly escaped or base64 encoded.`
            )
          }

          const isValid = await bcrypt.compare(credentials.password, superAdminPasswordHash)

          if (!isValid) {
            throw new Error("Invalid credentials")
          }

          return {
            id: "super-admin",
            email: credentials.email,
            name: "Super Admin",
            role: "SuperAdmin",
            tenantId: "",
            tenantSlug: "",
            isSuperAdmin: true,
          }
        }

        // Regular tenant-based login
        if (!credentials?.tenantSlug) {
          throw new Error("Missing tenant")
        }

        // Find tenant by slug
        const tenant = await prisma.tenant.findUnique({
          where: { slug: credentials.tenantSlug },
        })

        if (!tenant) {
          throw new Error("Invalid tenant")
        }

        // Find user by email and tenant
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            tenantId: tenant.id,
          },
        })

        if (!user) {
          throw new Error("Invalid credentials")
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
          isSuperAdmin: false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId || ""
        token.tenantSlug = user.tenantSlug || ""
        token.isSuperAdmin = (user as any).isSuperAdmin || false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.tenantSlug = token.tenantSlug as string
        session.user.isSuperAdmin = (token.isSuperAdmin as boolean) || false
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
