import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Company',
    },
  })

  console.log('✅ Created tenant:', tenant.slug)

  // Create a demo admin user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const admin = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'admin@demo.com',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'Admin',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create default component statuses with colors
  const componentStatuses = [
    { name: 'Keep', color: 'green' },
    { name: 'Replace', color: 'orange' },
    { name: 'Repair', color: 'blue' },
    { name: 'Remove', color: 'red' },
    { name: 'Review', color: 'gray' },
  ]
  for (let i = 0; i < componentStatuses.length; i++) {
    const existing = await prisma.componentStatus.findFirst({
      where: {
        tenantId: tenant.id,
        name: componentStatuses[i].name,
      },
    })

    if (!existing) {
      await prisma.componentStatus.create({
        data: {
          tenantId: tenant.id,
          name: componentStatuses[i].name,
          color: componentStatuses[i].color,
          order: i,
          isDefault: true,
        },
      })
    } else if (!existing.color) {
      // Update existing statuses that don't have a color
      await prisma.componentStatus.update({
        where: { id: existing.id },
        data: { color: componentStatuses[i].color },
      })
    }
  }
  console.log(`✅ Created ${componentStatuses.length} default component statuses`)

  // Create default quality statuses
  const qualityStatuses = ['Excellent', 'Great', 'Fair', 'Poor']
  for (let i = 0; i < qualityStatuses.length; i++) {
    const existing = await prisma.qualityStatus.findFirst({
      where: {
        tenantId: tenant.id,
        name: qualityStatuses[i],
      },
    })

    if (!existing) {
      await prisma.qualityStatus.create({
        data: {
          tenantId: tenant.id,
          name: qualityStatuses[i],
          order: i,
          isDefault: true,
        },
      })
    }
  }
  console.log(`✅ Created ${qualityStatuses.length} default quality statuses`)

  // Create default room templates
  const roomTemplates = [
    'All Rooms',
    'Foyer',
    'Living Room',
    'Kitchen',
    'Bedroom 1',
    'Bedroom 2',
    'Bedroom 3',
    'Bathroom 1',
    'Bathroom 2',
    'Bathroom 3',
    'Den',
    'Powder Room',
  ]
  for (let i = 0; i < roomTemplates.length; i++) {
    const existing = await prisma.roomTemplate.findFirst({
      where: {
        tenantId: tenant.id,
        name: roomTemplates[i],
      },
    })

    if (!existing) {
      await prisma.roomTemplate.create({
        data: {
          tenantId: tenant.id,
          name: roomTemplates[i],
          order: i,
          isDefault: true,
        },
      })
    }
  }
  console.log(`✅ Created ${roomTemplates.length} default room templates`)

  // Create default component categories and components
  const componentData = [
    {
      category: 'Appliances',
      components: ['Refrigerator', 'Microwave', 'Range', 'Cooktop', 'Dishwasher', 'Garbage Disposal'],
    },
    {
      category: 'Plumbing',
      components: ['Sink', 'Faucet', 'P-Trap', 'Ice Line'],
    },
    {
      category: 'Electrical',
      components: ['Outlets & Switches', 'Ceiling Lights', 'Sconces'],
    },
    {
      category: 'Flooring',
      components: ['LVP', 'Carpet', 'Sheet Vinyl', 'Hardwood'],
    },
    {
      category: 'Painting',
      components: ['Wall Paint', 'Trim Paint'],
    },
    {
      category: 'Carpentry',
      components: ['Baseboard', 'Crown Molding', 'Door Casing', 'Interior Door', 'Pocket Door'],
    },
    {
      category: 'Shelving',
      components: ['Wire Shelving', 'Wood Shelving'],
    },
    {
      category: 'Mechanical',
      components: ['HVAC System'],
    },
    {
      category: 'Concrete',
      components: ['Patio', 'Porch', 'Steps'],
    },
    {
      category: 'Exterior',
      components: ['Window', 'Doors'],
    },
  ]

  let totalComponents = 0
  for (let catIndex = 0; catIndex < componentData.length; catIndex++) {
    const { category, components } = componentData[catIndex]
    
    // Check if category exists, create if not
    let categoryRecord = await prisma.componentCategory.findFirst({
      where: {
        tenantId: tenant.id,
        name: category,
      },
    })

    if (!categoryRecord) {
      categoryRecord = await prisma.componentCategory.create({
        data: {
          tenantId: tenant.id,
          name: category,
          order: catIndex,
          isDefault: true,
        },
      })
    }

    // Create components for this category
    for (let compIndex = 0; compIndex < components.length; compIndex++) {
      const componentName = components[compIndex]
      
      const existing = await prisma.component.findFirst({
        where: {
          tenantId: tenant.id,
          categoryId: categoryRecord.id,
          name: componentName,
        },
      })

      if (!existing) {
        await prisma.component.create({
          data: {
            tenantId: tenant.id,
            categoryId: categoryRecord.id,
            name: componentName,
            order: compIndex,
            isDefault: true,
          },
        })
        totalComponents++
      }
    }
  }
  console.log(`✅ Created ${componentData.length} component categories with ${totalComponents} default components`)

  // Create multiple communities
  const communities = [
    {
      name: 'Sunset Villas',
      address: '123 Main Street, City, State 12345',
    },
    {
      name: 'Oakwood Apartments',
      address: '456 Oak Avenue, City, State 12346',
    },
    {
      name: 'Riverside Commons',
      address: '789 River Road, City, State 12347',
    },
  ]

  const createdCommunities = []
  for (const comm of communities) {
    const community = await prisma.community.upsert({
      where: { id: `demo-${comm.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `demo-${comm.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: comm.name,
        address: comm.address,
        tenantId: tenant.id,
      },
    })
    createdCommunities.push(community)
    console.log('✅ Created community:', community.name)
  }

  // Create buildings for each community
  for (const community of createdCommunities) {
    const buildingNames = ['Building A', 'Building B', 'Building C']
    
    for (const buildingName of buildingNames) {
      const building = await prisma.building.create({
        data: {
          name: buildingName,
          address: `${community.address}`,
          communityId: community.id,
        },
      })
      console.log(`✅ Created ${building.name} in ${community.name}`)

      // Create units for each building (10 units per building)
      for (let i = 1; i <= 10; i++) {
        await prisma.unit.create({
          data: {
            number: i.toString().padStart(3, '0'),
            buildingId: building.id,
          },
        })
      }
      console.log(`✅ Created 10 units in ${building.name}`)
    }
  }

  console.log('🎉 Seeding completed!')
  console.log('\n📝 Login credentials:')
  console.log('   Tenant Slug: demo')
  console.log('   Email: admin@demo.com')
  console.log('   Password: demo123')
  console.log(`\n📊 Created:`)
  console.log(`   - ${componentStatuses.length} component statuses`)
  console.log(`   - ${qualityStatuses.length} quality statuses`)
  console.log(`   - ${roomTemplates.length} room templates`)
  console.log(`   - ${componentData.length} component categories with components`)
  console.log(`   - ${createdCommunities.length} communities`)
  console.log(`   - ${createdCommunities.length * 3} buildings`)
  console.log(`   - ${createdCommunities.length * 3 * 10} units`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
