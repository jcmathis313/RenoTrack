import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { name, type, components } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      )
    }

    // Verify template belongs to user's tenant
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

    const templateRoom = await prisma.templateRoom.create({
      data: {
        templateId: params.id,
        name: name.trim(),
        type: type || null,
        order: nextOrder,
        templateComponents: components
          ? {
              create: components.map((component: any) => ({
                componentType: component.componentType,
                componentName: component.componentName || null,
                condition: component.condition || null,
                materialId: component.materialId || null,
                vendorId: component.vendorId || null,
                quantity: component.quantity || 1,
                unitCost: component.unitCost || 0,
                notes: component.notes || null,
              })),
            }
          : undefined,
      },
      include: {
        templateComponents: true,
      },
    })

    return NextResponse.json(templateRoom, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template room:", error)
    return NextResponse.json(
      { error: "Failed to create template room" },
      { status: 500 }
    )
  }
}

