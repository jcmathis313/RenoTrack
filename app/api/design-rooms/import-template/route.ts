import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { designProjectId, templateRoomIds } = body

    if (!designProjectId || !templateRoomIds || !Array.isArray(templateRoomIds)) {
      return NextResponse.json(
        { error: "Design Project ID and template room IDs are required" },
        { status: 400 }
      )
    }

    // Verify design project belongs to user's tenant
    const designProject = await prisma.designProject.findFirst({
      where: {
        id: designProjectId,
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
    })

    if (!designProject) {
      return NextResponse.json(
        { error: "Design project not found or access denied" },
        { status: 404 }
      )
    }

    // Fetch template rooms with components
    const templateRooms = await prisma.templateRoom.findMany({
      where: {
        id: { in: templateRoomIds },
        template: {
          tenantId: user.tenantId,
        },
      },
      include: {
        templateComponents: true,
      },
    })

    if (templateRooms.length === 0) {
      return NextResponse.json(
        { error: "Template rooms not found or access denied" },
        { status: 404 }
      )
    }

    // Create design rooms from template rooms
    const createdRooms = []
    for (const templateRoom of templateRooms) {
      const designRoom = await prisma.designRoom.create({
        data: {
          designProjectId,
          name: templateRoom.name,
          type: templateRoom.type || null,
          designComponents: {
            create: templateRoom.templateComponents.map((tc) => ({
              componentType: tc.componentType,
              componentName: tc.componentName || null,
              condition: tc.condition || null,
              materialId: tc.materialId || null,
              vendorId: tc.vendorId || null,
              quantity: tc.quantity || 1,
              unitCost: tc.unitCost || 0,
              totalCost: (tc.quantity || 1) * (tc.unitCost || 0),
              notes: tc.notes || null,
            })),
          },
        },
        include: {
          designComponents: true,
        },
      })
      createdRooms.push(designRoom)
    }

    return NextResponse.json(createdRooms, { status: 201 })
  } catch (error: any) {
    console.error("Error importing template rooms:", error)
    return NextResponse.json(
      { error: "Failed to import template rooms" },
      { status: 500 }
    )
  }
}

