import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inspection = await prisma.inspection.findFirst({
      where: {
        id,
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

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found or access denied" },
        { status: 404 }
      )
    }

    // Fetch catalog items for material references
    const materialIds = inspection.designProject.designRooms
      .flatMap((room) => room.designComponents)
      .map((comp) => comp.materialId)
      .filter((id): id is string => id !== null)

    const catalogItems = materialIds.length > 0
      ? await prisma.catalogItem.findMany({
          where: {
            id: { in: materialIds },
            tenantId: user.tenantId,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            component: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : []

    // Match inspection components with their corresponding design components
    // to get catalog item details and condition
    const enrichedInspection = {
      ...inspection,
      inspectionRooms: inspection.inspectionRooms.map((inspectionRoom) => {
        // Find matching design room
        const designRoom = inspection.designProject.designRooms.find(
          (dr) => dr.name === inspectionRoom.name
        )

        return {
          ...inspectionRoom,
          inspectionComponents: inspectionRoom.inspectionComponents.map((inspectionComponent) => {
            // Find matching design component
            const designComponent = designRoom?.designComponents.find(
              (dc) =>
                dc.componentType === inspectionComponent.componentType &&
                (dc.componentName === inspectionComponent.componentName ||
                  (!dc.componentName && !inspectionComponent.componentName))
            )

            // Find catalog item if materialId exists
            const catalogItem = designComponent?.materialId
              ? catalogItems.find((item) => item.id === designComponent.materialId)
              : null

            return {
              ...inspectionComponent,
              designComponent: designComponent
                ? {
                    condition: designComponent.condition,
                    materialId: designComponent.materialId,
                    catalogItem: catalogItem || null,
                    quantity: designComponent.quantity,
                    unitCost: designComponent.unitCost,
                    totalCost: designComponent.totalCost,
                    residentUpgrade: designComponent.residentUpgrade,
                    notes: designComponent.notes,
                  }
                : null,
            }
          }),
        }
      }),
    }

    return NextResponse.json(enrichedInspection)
  } catch (error: any) {
    console.error("Error fetching inspection:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Failed to fetch inspection",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    if (status && !["draft", "in progress", "complete"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'draft', 'in progress', or 'complete'" },
        { status: 400 }
      )
    }

    // Verify inspection belongs to user's tenant
    const inspection = await prisma.inspection.findFirst({
      where: {
        id,
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
    })

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found or access denied" },
        { status: 404 }
      )
    }

    // Update inspection status
    const updated = await prisma.inspection.update({
      where: { id },
      data: {
        status: status || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating inspection:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Failed to update inspection",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

