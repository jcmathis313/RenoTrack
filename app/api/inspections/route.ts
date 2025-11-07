import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Get all inspections for this tenant
    const inspections = await prisma.inspection.findMany({
      where: {
        designProject: {
          unit: {
            building: {
              community: {
                tenantId: user.tenantId,
              },
            },
          },
        },
      },
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
                        logoUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        inspectionRooms: {
          include: {
            _count: {
              select: {
                inspectionComponents: true,
              },
            },
            inspectionComponents: {
              select: {
                status: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(inspections)
  } catch (error: any) {
    console.error("Error fetching inspections:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Failed to fetch inspections",
        details: error?.message || "Unknown error"
      },
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
    const { designProjectId, inspectedBy } = body

    if (!designProjectId) {
      return NextResponse.json(
        { error: "Design Project ID is required" },
        { status: 400 }
      )
    }

    // Verify design project belongs to user's tenant and is complete
    const designProject = await prisma.designProject.findFirst({
      where: {
        id: designProjectId,
        status: "complete",
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      include: {
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

    if (!designProject) {
      return NextResponse.json(
        { error: "Complete selection not found or access denied" },
        { status: 404 }
      )
    }

    // Create inspection with rooms and components
    const inspection = await prisma.inspection.create({
      data: {
        designProjectId,
        inspectedBy: inspectedBy || null,
        inspectionRooms: {
          create: designProject.designRooms.map((room, roomIndex) => ({
            name: room.name,
            type: room.type || null,
            order: roomIndex,
            inspectionComponents: {
              create: room.designComponents.map((component) => ({
                componentType: component.componentType,
                componentName: component.componentName || null,
                status: null, // Start with no status
              })),
            },
          })),
        },
      },
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
                        logoUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        inspectionRooms: {
          include: {
            inspectionComponents: {
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

    return NextResponse.json(inspection, { status: 201 })
  } catch (error: any) {
    console.error("Error creating inspection:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Failed to create inspection",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

