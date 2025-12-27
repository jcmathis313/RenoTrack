import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
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
    const { name } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Fetch the source template room with all components
    const sourceRoom = await prisma.templateRoom.findFirst({
      where: {
        id: params.roomId,
        template: {
          id: params.id,
          tenantId: user.tenantId,
        },
      },
      include: {
        templateComponents: true,
      },
    })

    if (!sourceRoom) {
      return NextResponse.json(
        { error: "Template room not found" },
        { status: 404 }
      )
    }

    // Verify template belongs to user's tenant and get current max order
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        templateRooms: {
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Get next order value
    const nextOrder = template.templateRooms.length > 0 
      ? template.templateRooms[0].order + 1 
      : 0

    // Create the cloned room with all components
    const clonedRoom = await prisma.templateRoom.create({
      data: {
        templateId: params.id,
        name: name.trim(),
        type: sourceRoom.type,
        order: nextOrder,
        templateComponents: {
          create: sourceRoom.templateComponents.map((component) => ({
            componentType: component.componentType,
            componentName: component.componentName,
            condition: component.condition,
            materialId: component.materialId,
            vendorId: component.vendorId,
            quantity: component.quantity,
            unitCost: component.unitCost,
            notes: component.notes,
          })),
        },
      },
      include: {
        templateComponents: true,
      },
    })

    return NextResponse.json(clonedRoom, { status: 201 })
  } catch (error: any) {
    console.error("Error cloning template room:", error)
    
    return NextResponse.json(
      { error: error?.message || "Failed to clone template room" },
      { status: 500 }
    )
  }
}

