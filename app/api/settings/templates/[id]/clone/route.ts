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
    const { name } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Fetch the source template with all rooms and components
    const sourceTemplate = await prisma.template.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        templateRooms: {
          include: {
            templateComponents: true,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!sourceTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Create the cloned template with all rooms and components
    const clonedTemplate = await prisma.template.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        templateRooms: {
          create: sourceTemplate.templateRooms.map((room) => ({
            name: room.name,
            type: room.type,
            order: room.order,
            templateComponents: {
              create: room.templateComponents.map((component) => ({
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
          })),
        },
      },
      include: {
        templateRooms: {
          include: {
            templateComponents: true,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(clonedTemplate, { status: 201 })
  } catch (error: any) {
    console.error("Error cloning template:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to clone template" },
      { status: 500 }
    )
  }
}

