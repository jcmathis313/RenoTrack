import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id

    // Base include object without new tables
    const baseInclude: any = {
      unit: {
        include: {
          building: {
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePictureUrl: true,
            },
          },
        },
      },
      assessments: {
        include: {
          unit: {
            include: {
              building: {
                include: {
                  community: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          rooms: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          assessedAt: "desc",
        },
      },
      selections: {
        include: {
          unit: {
            include: {
              building: {
                include: {
                  community: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          designRooms: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      inspections: {
        include: {
          designProject: {
            include: {
              unit: {
                include: {
                  building: {
                    include: {
                      community: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          inspectionRooms: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          inspectedAt: "desc",
        },
      },
    }

    let project: any = null

    // Try to use full include with all relations
    try {
      const fullInclude = {
        ...baseInclude,
        residents: {
          orderBy: {
            createdAt: "asc",
          },
        },
        projectNotes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      }

      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          tenantId: user.tenantId,
        },
        include: fullInclude,
      })
      
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }
    } catch (includeError: any) {
      // If including relations fails (tables might not exist), try without them
      console.error("Error including residents/notes:", includeError?.code, includeError?.message)
      console.error("Error details:", includeError)
      
      // Try again without the new relations
      try {
        project = await prisma.project.findFirst({
          where: {
            id: projectId,
            tenantId: user.tenantId,
          },
          include: baseInclude,
        })
        
        if (!project) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
          )
        }
        
        // Add empty arrays for the relations
        Object.assign(project, {
          residents: [],
          projectNotes: [],
        })
      } catch (fallbackError: any) {
        console.error("Fallback query also failed:", fallbackError?.code, fallbackError?.message)
        throw fallbackError
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Ensure residents and projectNotes arrays exist
    if (!project.residents) {
      project.residents = []
    }
    if (!project.projectNotes) {
      project.projectNotes = []
    }

    // Ensure status exists - fetch it explicitly if missing
    const projectAny = project as any
    if (!projectAny.status) {
      try {
        const [statusResult] = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "status" FROM "Project" WHERE id = $1`,
          projectId
        )
        if (statusResult) {
          projectAny.status = statusResult.status || "Pending"
        } else {
          projectAny.status = "Pending"
        }
      } catch (e) {
        // Column doesn't exist or query failed, use default
        projectAny.status = "Pending"
      }
    }

    return NextResponse.json(project)
  } catch (error: any) {
    console.error("Error fetching project:", error)
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
    console.error("Error meta:", error?.meta)
    console.error("Error stack:", error?.stack)
    
    // Check if this is a schema mismatch error
    const errorMessage = error?.message || ""
    const errorCode = error?.code || ""
    
    if (
      errorMessage.includes("does not exist") ||
      errorMessage.includes("column") ||
      errorMessage.includes("Unknown column") ||
      errorMessage.includes("relation") ||
      errorCode === "42P01" || // PostgreSQL: undefined_table
      errorCode === "42703" || // PostgreSQL: undefined_column
      errorCode === "P2021"    // Prisma: table does not exist
    ) {
      return NextResponse.json(
        {
          error: "Database schema mismatch detected. The Prisma schema includes new fields (vacancyDate, moveInDate, residents, projectNotes) that don't exist in your database yet. Please run the SQL migration script in Supabase SQL Editor: scripts/add_project_fields.sql",
          details: `Error: ${errorMessage} (Code: ${errorCode})`,
          migrationScript: "scripts/add_project_fields.sql",
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        error: "Failed to fetch project",
        details: errorMessage || String(error),
        code: errorCode,
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

    const projectId = params.id
    const body = await request.json()
    const { name, notes, status, vacancyDate, moveInDate } = body

    // Verify project exists and belongs to user's tenant
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Base include without new tables
    const baseInclude: any = {
      unit: {
        include: {
          building: {
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          assessments: true,
          selections: true,
          inspections: true,
        },
      },
    }

    let project: any = null

    // Check if date columns exist
    let hasDateColumns = false
    try {
      await prisma.$queryRaw`SELECT "vacancyDate" FROM "Project" LIMIT 1`
      hasDateColumns = true
    } catch (e) {
      hasDateColumns = false
    }

    // Ensure status column exists
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'Pending'`
      )
    } catch (e: any) {
      // Column might already exist, that's fine
      console.log("Status column check:", e?.message || "Column exists or created")
    }

    // Prepare update data
    const updateData: any = {
      name: name?.trim() || existingProject.name,
      notes: notes !== undefined ? (notes?.trim() || null) : existingProject.notes,
    }

    // Try to include status in Prisma update
    if (status !== undefined) {
      updateData.status = status
    }

    // Update basic fields using Prisma
    try {
      project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: baseInclude,
      })
      console.log("Project updated via Prisma, status:", project.status)
    } catch (updateError: any) {
      // If Prisma update fails (e.g., column doesn't exist in DB yet),
      // update without status first, then update status with raw SQL
      console.error("Prisma update error:", updateError?.message)
      
      // Update without status
      project = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: updateData.name,
          notes: updateData.notes,
        },
        include: baseInclude,
      })
      
      // Update status with raw SQL if needed
      if (status !== undefined) {
        try {
          const result = await prisma.$executeRawUnsafe(
            `UPDATE "Project" SET "status" = $1 WHERE id = $2`,
            status,
            projectId
          )
          console.log("Status updated via raw SQL:", status, "Result:", result)
          // Fetch the updated status to confirm
          const [statusCheck] = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "status" FROM "Project" WHERE id = $1`,
            projectId
          )
          if (statusCheck) {
            project.status = statusCheck.status
            console.log("Confirmed status in DB:", statusCheck.status)
          } else {
            project.status = status
          }
        } catch (statusUpdateError: any) {
          console.error("Error updating status with raw SQL:", statusUpdateError)
          // Continue without status if update fails
        }
      }
    }

    // Update dates using raw SQL if columns exist
    if (hasDateColumns && (vacancyDate !== undefined || moveInDate !== undefined)) {
      const updates: string[] = []
      const values: any[] = []
      
      if (vacancyDate !== undefined) {
        updates.push(`"vacancyDate" = $${values.length + 1}`)
        values.push(vacancyDate ? new Date(vacancyDate) : null)
      }
      if (moveInDate !== undefined) {
        updates.push(`"moveInDate" = $${values.length + 1}`)
        values.push(moveInDate ? new Date(moveInDate) : null)
      }
      
      if (updates.length > 0) {
        values.push(projectId)
        await prisma.$executeRawUnsafe(
          `UPDATE "Project" SET ${updates.join(', ')} WHERE id = $${values.length}`,
          ...values
        )
        
        // Fetch updated dates
        const [updated] = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "vacancyDate", "moveInDate" FROM "Project" WHERE id = $1`,
          projectId
        )
        if (updated) {
          project.vacancyDate = updated.vacancyDate
          project.moveInDate = updated.moveInDate
        }
      }
    }
    
    // Ensure status is set correctly
    const projectAny = project as any
    const existingProjectAny = existingProject as any
    
    if (!projectAny.status && status !== undefined) {
      // Try to fetch status from DB
      try {
        const [statusResult] = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "status" FROM "Project" WHERE id = $1`,
          projectId
        )
        if (statusResult && statusResult.status) {
          projectAny.status = statusResult.status
        } else {
          projectAny.status = status
        }
      } catch (e) {
        projectAny.status = status || "Pending"
      }
    } else if (!projectAny.status) {
      projectAny.status = existingProjectAny.status || "Pending"
    }

    // Add placeholder fields for relations
    Object.assign(projectAny, {
      residents: projectAny.residents || [],
      projectNotes: projectAny.projectNotes || [],
      vacancyDate: projectAny.vacancyDate || null,
      moveInDate: projectAny.moveInDate || null,
      status: projectAny.status || "Pending",
    })

    console.log("Returning project with status:", project.status)
    return NextResponse.json(project)
  } catch (error: any) {
    console.error("Error updating project:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    return NextResponse.json(
      { 
        error: "Failed to update project",
        details: error?.message || String(error),
        code: error?.code,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { assignedUserIds } = body

    // Verify project exists and belongs to user's tenant
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Verify assigned users belong to the same tenant
    if (assignedUserIds && assignedUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: assignedUserIds },
          tenantId: user.tenantId,
        },
      })

      if (users.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: "One or more assigned users not found or access denied" },
          { status: 400 }
        )
      }
    }

    // Update assignments - delete all existing and create new ones
    await prisma.projectAssignment.deleteMany({
      where: { projectId },
    })

    if (assignedUserIds && assignedUserIds.length > 0) {
      await prisma.projectAssignment.createMany({
        data: assignedUserIds.map((userId: string) => ({
          projectId,
          userId,
        })),
      })
    }

    // Base include without new tables
    const baseInclude: any = {
      unit: {
        include: {
          building: {
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          assessments: true,
          selections: true,
          inspections: true,
        },
      },
    }

    // Try to include residents and projectNotes if tables exist
    let includeWithNewTables = {
      ...baseInclude,
      residents: {
        orderBy: {
          createdAt: "asc",
        },
      },
      projectNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    }

    let project: any = null

    try {
      // Try with new tables first
      project = await prisma.project.findUnique({
        where: { id: projectId },
        include: includeWithNewTables,
      })
    } catch (tableError: any) {
      // If tables don't exist, try without them
      if (
        tableError?.message?.includes("does not exist") ||
        tableError?.code === "P2021" ||
        tableError?.message?.includes("relation") ||
        tableError?.message?.includes("table")
      ) {
        console.warn(
          "New project tables (residents/notes) don't exist yet. Fetching without them."
        )
        project = await prisma.project.findUnique({
          where: { id: projectId },
          include: baseInclude,
        })
        // Add empty arrays for the new fields
        if (project) {
          project.residents = []
          project.projectNotes = []
        }
      } else {
        throw tableError
      }
    }

    // Ensure residents and projectNotes arrays exist
    if (!project?.residents) {
      project = { ...project, residents: [] }
    }
    if (!project?.projectNotes) {
      project = { ...project, projectNotes: [] }
    }

    return NextResponse.json(project)
  } catch (error: any) {
    console.error("Error updating project assignments:", error)
    return NextResponse.json(
      { error: "Failed to update project assignments" },
      { status: 500 }
    )
  }
}
