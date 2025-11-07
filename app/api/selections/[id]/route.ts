import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const selectionId = params.id

    if (!selectionId) {
      return NextResponse.json(
        { error: "Selection ID is required" },
        { status: 400 }
      )
    }

    console.log("Fetching selection with ID:", selectionId, "for tenant:", user.tenantId)

    // Check if the selection exists and belongs to the user's tenant
    const selection = await prisma.designProject.findFirst({
      where: {
        id: selectionId,
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
                    logoUrl: true,
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

    if (!selection) {
      console.log("Selection not found or doesn't belong to tenant:", selectionId, "Tenant ID:", user.tenantId)
      return NextResponse.json(
        { error: "Selection not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json(selection)
  } catch (error: any) {
    console.error("Error fetching selection:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: "Failed to fetch selection", details: error?.message || "Unknown error" },
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

    const selectionId = params.id

    if (!selectionId) {
      return NextResponse.json(
        { error: "Selection ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    // Validate status if provided
    const validStatuses = ["draft", "pending approval", "complete"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Verify selection belongs to user's tenant
    const existing = await prisma.designProject.findFirst({
      where: {
        id: selectionId,
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Selection not found or access denied" },
        { status: 404 }
      )
    }

    // Update the selection
    const updated = await prisma.designProject.update({
      where: { id: selectionId },
      data: {
        status: status || null,
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
                    logoUrl: true,
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

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating selection:", error)
    return NextResponse.json(
      { error: "Failed to update selection", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
