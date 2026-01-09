import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get("unitId")

    // Build where clause
    const where: any = {
      tenantId: user.tenantId,
    }

    if (unitId) {
      where.unitId = unitId
      // Verify unit belongs to user's tenant
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      })

      if (!unit) {
        return NextResponse.json(
          { error: "Unit not found" },
          { status: 404 }
        )
      }
    }

    const projects = await prisma.project.findMany({
      where,
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
        residents: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            assessments: true,
            selections: true,
            inspections: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Ensure status exists for all projects - fetch explicitly if missing
    for (const project of projects) {
      const projectAny = project as any
      if (!projectAny.status) {
        try {
          const [statusResult] = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "status" FROM "Project" WHERE id = $1`,
            project.id
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
    }

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { unitId, name, notes, assignedUserIds } = body

    if (!unitId || !name) {
      return NextResponse.json(
        { error: "Unit ID and name are required" },
        { status: 400 }
      )
    }

    // Verify the unit belongs to the user's tenant
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        building: {
          community: {
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found or access denied" },
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

    // Create project with assignments if provided
    const project = await prisma.project.create({
      data: {
        unitId,
        tenantId: user.tenantId,
        name: name.trim(),
        notes: notes?.trim() || null,
        assignments: assignedUserIds && assignedUserIds.length > 0
          ? {
              create: assignedUserIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
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
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
