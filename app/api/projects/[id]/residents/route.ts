import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id
    const body = await request.json()
    const { lastName, firstName, phone, email } = body

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Last name and first name are required" },
        { status: 400 }
      )
    }

    // Verify project exists and belongs to user's tenant
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Try to create resident using Prisma
    let resident: any
    try {
      resident = await prisma.projectResident.create({
        data: {
          projectId,
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
        },
      })
    } catch (prismaError: any) {
      console.error("Error creating resident with Prisma:", prismaError?.code, prismaError?.message)
      console.error("Full error:", prismaError)
      
      const errorMessage = prismaError?.message || ""
      const errorCode = prismaError?.code || ""
      
      // Table doesn't exist or other schema issue
      if (
        errorCode === "P2021" || 
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("table") ||
        errorCode === "42P01" ||
        errorCode === "42703"
      ) {
        // Try with raw SQL
        try {
          const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          // Try PascalCase first
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO "ProjectResident" (id, "projectId", "lastName", "firstName", phone, email, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              id, projectId, lastName.trim(), firstName.trim(), phone?.trim() || null, email?.trim() || null
            )
            resident = {
              id,
              projectId,
              lastName: lastName.trim(),
              firstName: firstName.trim(),
              phone: phone?.trim() || null,
              email: email?.trim() || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          } catch (caseError: any) {
            // Try lowercase
            console.warn("PascalCase failed, trying lowercase:", caseError?.message)
            await prisma.$executeRawUnsafe(
              `INSERT INTO "projectresident" (id, "projectId", "lastName", "firstName", phone, email, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              id, projectId, lastName.trim(), firstName.trim(), phone?.trim() || null, email?.trim() || null
            )
            resident = {
              id,
              projectId,
              lastName: lastName.trim(),
              firstName: firstName.trim(),
              phone: phone?.trim() || null,
              email: email?.trim() || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }
        } catch (rawSqlError: any) {
          console.error("Raw SQL also failed:", rawSqlError?.code, rawSqlError?.message)
          console.error("Raw SQL error details:", rawSqlError)
          
          // Provide helpful error message
          return NextResponse.json(
            {
              error: `Table "ProjectResident" does not exist or cannot be accessed. Please verify the SQL migration script ran successfully.`,
              details: rawSqlError?.message || "Unknown error",
              errorCode: rawSqlError?.code,
              hint: "Run scripts/check_project_resident.sql in Supabase to verify table exists",
            },
            { status: 500 }
          )
        }
      } else {
        // Other error - rethrow
        throw prismaError
      }
    }

    return NextResponse.json(resident, { status: 201 })
  } catch (error: any) {
    console.error("Error creating resident:", error)
    console.error("Error code:", error?.code)
    console.error("Error message:", error?.message)
    console.error("Full error:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        error: error?.message || "Failed to create resident",
        details: error?.code || "Unknown error",
        hint: "Please check server console for detailed error. Verify ProjectResident table exists in database."
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const residentId = searchParams.get("residentId")

    if (!residentId) {
      return NextResponse.json(
        { error: "Resident ID is required" },
        { status: 400 }
      )
    }

    const projectId = params.id
    const body = await request.json()
    const { lastName, firstName, phone, email } = body

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Last name and first name are required" },
        { status: 400 }
      )
    }

    // Verify project belongs to user's tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Update resident - try Prisma first, fallback to raw SQL
    let updated: any
    try {
      updated = await prisma.projectResident.update({
        where: { id: residentId },
        data: {
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
        },
      })
    } catch (prismaError: any) {
      if (prismaError?.code === "P2021" || prismaError?.message?.includes("does not exist")) {
        // Use raw SQL
        await prisma.$executeRawUnsafe(
          `UPDATE "ProjectResident" 
           SET "lastName" = $1, "firstName" = $2, phone = $3, email = $4, "updatedAt" = NOW()
           WHERE id = $5 AND "projectId" = $6`,
          lastName.trim(), firstName.trim(), phone?.trim() || null, email?.trim() || null, residentId, projectId
        )
        const [result] = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "ProjectResident" WHERE id = $1`,
          residentId
        )
        updated = result
      } else {
        throw prismaError
      }
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating resident:", error)
    return NextResponse.json(
      { error: "Failed to update resident" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const residentId = searchParams.get("residentId")

    if (!residentId) {
      return NextResponse.json(
        { error: "Resident ID is required" },
        { status: 400 }
      )
    }

    const projectId = params.id

    // Verify project belongs to user's tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Delete resident - try Prisma first, fallback to raw SQL
    try {
      await prisma.projectResident.delete({
        where: { id: residentId },
      })
    } catch (prismaError: any) {
      if (prismaError?.code === "P2021" || prismaError?.message?.includes("does not exist")) {
        // Use raw SQL
        await prisma.$executeRawUnsafe(
          `DELETE FROM "ProjectResident" WHERE id = $1 AND "projectId" = $2`,
          residentId, projectId
        )
      } else {
        throw prismaError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting resident:", error)
    return NextResponse.json(
      { error: "Failed to delete resident" },
      { status: 500 }
    )
  }
}

