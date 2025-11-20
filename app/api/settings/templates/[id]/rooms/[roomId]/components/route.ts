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
    const {
      componentType,
      componentName,
      condition,
      materialId,
      vendorId,
      quantity,
      unitCost,
      notes,
    } = body

    if (!componentType || typeof componentType !== "string" || !componentType.trim()) {
      return NextResponse.json(
        { error: "Component type is required" },
        { status: 400 }
      )
    }

    // Verify template room belongs to user's tenant
    const templateRoom = await prisma.templateRoom.findFirst({
      where: {
        id: params.roomId,
        template: {
          id: params.id,
          tenantId: user.tenantId,
        },
      },
    })

    if (!templateRoom) {
      return NextResponse.json(
        { error: "Template room not found" },
        { status: 404 }
      )
    }

    const templateComponent = await prisma.templateComponent.create({
      data: {
        templateRoomId: params.roomId,
        componentType: componentType.trim(),
        componentName: componentName?.trim() || null,
        condition: condition?.trim() || null,
        materialId: materialId || null,
        vendorId: vendorId || null,
        quantity: quantity || 1,
        unitCost: unitCost || 0,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(templateComponent, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template component:", error)
    return NextResponse.json(
      { error: "Failed to create template component" },
      { status: 500 }
    )
  }
}

