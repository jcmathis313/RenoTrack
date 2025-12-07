import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking Prisma User model fields...')
    
    // Try to get a user with all fields
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        jobTitle: true,
        profilePictureUrl: true,
        role: true,
      },
    })
    
    console.log('✅ Successfully queried user with all fields:', user)
    console.log('Fields present:', Object.keys(user || {}))
  } catch (error: any) {
    console.error('❌ Error querying with new fields:', error.message)
    
    // Try without new fields
    try {
      const user = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          profilePictureUrl: true,
          role: true,
        },
      })
      console.log('✅ Can query without new fields:', user)
    } catch (error2: any) {
      console.error('❌ Error even without new fields:', error2.message)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

