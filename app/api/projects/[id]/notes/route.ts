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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Note content is required" },
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

    // Try to create note using Prisma
    let note: any
    try {
      note = await prisma.projectNote.create({
        data: {
          projectId,
          content: content.trim(),
        },
      })
    } catch (prismaError: any) {
      console.error("Error creating note with Prisma:", prismaError?.code, prismaError?.message)
      console.error("Full error:", prismaError)
      
      // Check what the actual error is
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
        // Try with raw SQL - check different possible table names
        try {
          const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          // Try PascalCase first (what Prisma expects)
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO "ProjectNote" (id, "projectId", content, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, NOW(), NOW())`,
              id, projectId, content.trim()
            )
            note = {
              id,
              projectId,
              content: content.trim(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          } catch (caseError: any) {
            // Try lowercase
            console.warn("PascalCase failed, trying lowercase:", caseError?.message)
            await prisma.$executeRawUnsafe(
              `INSERT INTO "projectnote" (id, "projectId", content, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, NOW(), NOW())`,
              id, projectId, content.trim()
            )
            note = {
              id,
              projectId,
              content: content.trim(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }
        } catch (rawSqlError: any) {
          console.error("Raw SQL also failed:", rawSqlError?.message)
          throw new Error(`Table "ProjectNote" does not exist. Please run the SQL migration script: scripts/add_project_fields.sql. Error: ${rawSqlError?.message}`)
        }
      } else {
        // Other error - rethrow
        throw prismaError
      }
    }

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    console.error("Error creating note:", error)
    console.error("Error code:", error?.code)
    console.error("Error message:", error?.message)
    return NextResponse.json(
      { 
        error: error?.message || "Failed to create note",
        details: error?.code || "Unknown error",
        hint: "If you see 'does not exist', please verify the SQL migration script ran successfully. Run scripts/verify_project_tables.sql to check."
      },
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
    const noteId = searchParams.get("noteId")

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
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

    // Delete note - try Prisma first, fallback to raw SQL
    try {
      await prisma.projectNote.delete({
        where: { id: noteId },
      })
    } catch (prismaError: any) {
      if (prismaError?.code === "P2021" || prismaError?.message?.includes("does not exist")) {
        // Use raw SQL
        await prisma.$executeRawUnsafe(
          `DELETE FROM "ProjectNote" WHERE id = $1 AND "projectId" = $2`,
          noteId, projectId
        )
      } else {
        throw prismaError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}

