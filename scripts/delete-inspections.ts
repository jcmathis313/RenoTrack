import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Finding all inspections...")
  
  const inspections = await prisma.inspection.findMany({
    include: {
      inspectionRooms: {
        include: {
          _count: {
            select: {
              inspectionComponents: true,
            },
          },
        },
      },
    },
  })

  console.log(`Found ${inspections.length} inspection(s):`)
  inspections.forEach((inspection) => {
    const componentCount = inspection.inspectionRooms.reduce(
      (sum, room) => sum + room._count.inspectionComponents,
      0
    )
    console.log(`  - ${inspection.id} (${inspection.inspectionRooms.length} rooms, ${componentCount} components)`)
  })

  if (inspections.length === 0) {
    console.log("✅ No inspections to delete.")
    return
  }

  console.log("\n🗑️  Deleting inspections...")
  
  for (const inspection of inspections) {
    // Delete inspection (cascade will delete rooms and components)
    await prisma.inspection.delete({
      where: { id: inspection.id },
    })
    console.log(`  ✅ Deleted inspection ${inspection.id}`)
  }

  console.log(`\n✅ Successfully deleted ${inspections.length} inspection(s)!`)
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

