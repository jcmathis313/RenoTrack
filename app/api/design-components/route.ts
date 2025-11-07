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
    const { designRoomId, components } = body // components is an array

    if (!designRoomId) {
      return NextResponse.json(
        { error: "Design Room ID is required" },
        { status: 400 }
      )
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: "At least one component is required" },
        { status: 400 }
      )
    }

    // Verify design room belongs to user's tenant
    const designRoom = await prisma.designRoom.findFirst({
      where: {
        id: designRoomId,
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

    if (!designRoom) {
      return NextResponse.json(
        { error: "Design room not found or access denied" },
        { status: 404 }
      )
    }

    // Create all components
    const createdComponents = await Promise.all(
      components.map((comp: any) =>
        prisma.designComponent.create({
          data: {
            designRoomId,
            componentType: comp.componentType?.trim() || "",
            componentName: comp.componentName?.trim() || null,
            materialId: comp.materialId || null,
            vendorId: comp.vendorId || null,
            quantity: comp.quantity || 1,
            unitCost: comp.unitCost || 0,
            totalCost: (comp.quantity || 1) * (comp.unitCost || 0),
            notes: comp.notes?.trim() || null,
          },
        })
      )
    )

    return NextResponse.json(createdComponents, { status: 201 })
  } catch (error: any) {
    console.error("Error creating design components:", error)
    return NextResponse.json(
      { error: "Failed to create design components" },
      { status: 500 }
    )
  }
}
