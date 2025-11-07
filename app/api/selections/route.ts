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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const selections = await prisma.designProject.findMany({
      where: {
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
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
        assessment: {
          select: {
            id: true,
            assessedAt: true,
            assessedBy: true,
          },
        },
        _count: {
          select: {
            designRooms: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(selections)
  } catch (error: any) {
    console.error("Error fetching selections:", error)
    return NextResponse.json(
      { error: "Failed to fetch selections" },
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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { unitId, assessmentId, name, status } = body

    if (!unitId || !name) {
      return NextResponse.json(
        { error: "Unit and name are required" },
        { status: 400 }
      )
    }

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
        { error: "Unit not found or access denied" },
        { status: 404 }
      )
    }

    // If assessmentId provided, verify it belongs to the same unit and fetch its data
    let assessmentData = null
    if (assessmentId) {
      const assessment = await prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          unitId: unitId,
        },
        include: {
          rooms: {
            include: {
              componentAssessments: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      })

      if (!assessment) {
        return NextResponse.json(
          { error: "Assessment not found or doesn't belong to this unit" },
          { status: 404 }
        )
      }

      assessmentData = assessment
    }

    const selection = await prisma.designProject.create({
      data: {
        unitId,
        assessmentId: assessmentId || null,
        name: name.trim(),
        status: status || "Draft",
        totalCost: 0,
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
        assessment: {
          select: {
            id: true,
            assessedAt: true,
            assessedBy: true,
          },
        },
      },
    })

    // If assessment data exists, copy rooms and components to the selection
    if (assessmentData && assessmentData.rooms.length > 0) {
      // Create design rooms and components for each assessment room
      for (const room of assessmentData.rooms) {
        const designRoom = await prisma.designRoom.create({
          data: {
            designProjectId: selection.id,
            name: room.name,
            type: room.type || null,
          },
        })

        // Copy component assessments to design components
        if (room.componentAssessments.length > 0) {
          const designComponents = room.componentAssessments.map((component) => {
            return {
              designRoomId: designRoom.id,
              componentType: component.componentType,
              componentName: component.componentName || null,
              condition: component.condition || null,
              materialId: null, // Will be assigned later from catalog
              vendorId: null,
              quantity: 1,
              unitCost: 0,
              totalCost: 0,
              notes: component.notes || null,
            }
          })

          await prisma.designComponent.createMany({
            data: designComponents,
          })
        }
      }
    }

    // Fetch the complete selection with all rooms and components
    const completeSelection = await prisma.designProject.findUnique({
      where: { id: selection.id },
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
        assessment: {
          select: {
            id: true,
            assessedAt: true,
            assessedBy: true,
          },
        },
        designRooms: {
          include: {
            designComponents: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    return NextResponse.json(completeSelection, { status: 201 })
  } catch (error: any) {
    console.error("Error creating selection:", error)
    return NextResponse.json(
      { error: "Failed to create selection" },
      { status: 500 }
    )
  }
}
