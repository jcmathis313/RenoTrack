import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking statuses in database...\n')

  // Get all tenants
  const tenants = await prisma.tenant.findMany()
  console.log(`Found ${tenants.length} tenant(s):`)
  tenants.forEach(t => {
    console.log(`  - ${t.slug} (ID: ${t.id})`)
  })

  console.log('\n📋 Component Statuses:')
  for (const tenant of tenants) {
    const statuses = await prisma.componentStatus.findMany({
      where: { tenantId: tenant.id },
    })
    console.log(`  Tenant: ${tenant.slug} (${tenant.id})`)
    if (statuses.length === 0) {
      console.log('    ❌ No component statuses found')
    } else {
      statuses.forEach(s => {
        console.log(`    ✓ ${s.name} (isDefault: ${s.isDefault})`)
      })
    }
  }

  console.log('\n📊 Quality Statuses:')
  for (const tenant of tenants) {
    const statuses = await prisma.qualityStatus.findMany({
      where: { tenantId: tenant.id },
    })
    console.log(`  Tenant: ${tenant.slug} (${tenant.id})`)
    if (statuses.length === 0) {
      console.log('    ❌ No quality statuses found')
    } else {
      statuses.forEach(s => {
        console.log(`    ✓ ${s.name} (isDefault: ${s.isDefault})`)
      })
    }
  }

  // Check users
  console.log('\n👤 Users:')
  const users = await prisma.user.findMany()
  users.forEach(u => {
    console.log(`  - ${u.email} (Tenant ID: ${u.tenantId}, Role: ${u.role})`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
