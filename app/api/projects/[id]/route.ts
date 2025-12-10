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
    const { name, notes, vacancyDate, moveInDate } = body

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

    // Update basic fields using Prisma
    project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name?.trim() || existingProject.name,
        notes: notes !== undefined ? (notes?.trim() || null) : existingProject.notes,
      },
      include: baseInclude,
    })

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
    
    // Add placeholder fields for relations
    Object.assign(project, {
      residents: [],
      projectNotes: [],
      vacancyDate: project.vacancyDate || null,
      moveInDate: project.moveInDate || null,
    })

    return NextResponse.json(project)
  } catch (error: any) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
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
