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

    const selectionId = params.id

    if (!selectionId) {
      return NextResponse.json(
        { error: "Selection ID is required" },
        { status: 400 }
      )
    }

    // Verify selection belongs to user's tenant and fetch all rooms with components
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
        designRooms: {
          include: {
            designComponents: {
              where: {
                materialId: {
                  not: null,
                },
              },
              select: {
                id: true,
                componentType: true,
                componentName: true,
                materialId: true,
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
      return NextResponse.json(
        { error: "Selection not found or access denied" },
        { status: 404 }
      )
    }

    // Get all unique materialIds from all rooms
    const materialIds = Array.from(
      new Set(
        selection.designRooms
          .flatMap((room) => room.designComponents.map((comp) => comp.materialId))
          .filter((id): id is string => id !== null)
      )
    )

    // Fetch all catalog items with images
    const catalogItemsMap = new Map<string, any>()
    if (materialIds.length > 0) {
      const catalogItems = await prisma.catalogItem.findMany({
        where: {
          id: { in: materialIds },
          tenantId: user.tenantId,
          imageUrl: {
            not: null,
          },
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

      // Create a map for quick lookup
      catalogItems.forEach((item) => {
        catalogItemsMap.set(item.id, item)
      })
    }

    // Organize catalog items by room
    const roomsWithItems = selection.designRooms
      .map((room) => {
        const roomItemIds = room.designComponents
          .map((comp) => comp.materialId)
          .filter((id): id is string => id !== null)

        const roomCatalogItems = roomItemIds
          .map((id) => catalogItemsMap.get(id))
          .filter((item): item is any => item !== undefined)

        return {
          id: room.id,
          name: room.name,
          type: room.type,
          catalogItems: roomCatalogItems,
        }
      })
      .filter((room) => room.catalogItems.length > 0)

    return NextResponse.json({
      selection: {
        id: selection.id,
        name: selection.name,
      },
      rooms: roomsWithItems,
    })
  } catch (error: any) {
    console.error("Error fetching mood board data:", error)
    return NextResponse.json(
      { error: "Failed to fetch mood board data" },
      { status: 500 }
    )
  }
}



