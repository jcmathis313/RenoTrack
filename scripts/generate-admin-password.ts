import bcrypt from "bcryptjs"

/**
 * Script to generate a bcrypt hash for the super admin password
 * 
 * Usage:
 *   tsx scripts/generate-admin-password.ts "your-password-here"
 * 
 * Or run with Node:
 *   node -r tsx/register scripts/generate-admin-password.ts "your-password-here"
 */

async function main() {
  const password = process.argv[2]

  if (!password) {
    console.error("Error: Please provide a password as an argument")
    console.log("\nUsage:")
    console.log("  npm run generate-admin-password -- \"your-password-here\"")
    console.log("  or")
    console.log("  tsx scripts/generate-admin-password.ts \"your-password-here\"")
    process.exit(1)
  }

  if (password.length < 8) {
    console.error("Warning: Password should be at least 8 characters long")
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    console.log("\n✅ Password hash generated successfully!\n")
    console.log("Add this to your .env file:")
    console.log("=".repeat(60))
    console.log(`SUPER_ADMIN_PASSWORD="${hash}"`)
    console.log("=".repeat(60))
    console.log("\n⚠️  Keep this password secure and never commit it to version control!")
    console.log("\nAlso make sure to set SUPER_ADMIN_EMAILS in your .env file:")
    console.log('SUPER_ADMIN_EMAILS="your-email@example.com"')
    console.log("\nFor multiple admin emails (comma-separated):")
    console.log('SUPER_ADMIN_EMAILS="admin1@example.com,admin2@example.com"')
  } catch (error) {
    console.error("Error generating hash:", error)
    process.exit(1)
  }
}

main()






