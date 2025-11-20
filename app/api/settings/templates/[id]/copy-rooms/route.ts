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
    const { sourceType, sourceId, roomIds, rename } = body

    if (!sourceType || !sourceId || !roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { error: "Source type, source ID, and room IDs are required" },
        { status: 400 }
      )
    }

    // Verify template belongs to user's tenant
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    let sourceRooms: any[] = []

    // Fetch rooms from source (either design project or assessment)
    if (sourceType === "selection") {
      const designProject = await prisma.designProject.findFirst({
        where: {
          id: sourceId,
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
            where: {
              id: { in: roomIds },
            },
            include: {
              designComponents: true,
            },
          },
        },
      })

      if (!designProject) {
        return NextResponse.json(
          { error: "Selection not found or access denied" },
          { status: 404 }
        )
      }

      sourceRooms = designProject.designRooms.map((room) => ({
        name: rename ? `${room.name} (Copy)` : room.name,
        type: room.type,
        components: room.designComponents.map((comp) => ({
          componentType: comp.componentType,
          componentName: comp.componentName,
          condition: comp.condition,
          materialId: comp.materialId,
          vendorId: comp.vendorId,
          quantity: comp.quantity,
          unitCost: comp.unitCost,
          notes: comp.notes,
        })),
      }))
    } else if (sourceType === "assessment") {
      // For assessments, we'd need to fetch assessment rooms
      // This would require ComponentAssessment model structure
      // For now, return error
      return NextResponse.json(
        { error: "Copying from assessments not yet implemented" },
        { status: 501 }
      )
    } else {
      return NextResponse.json(
        { error: "Invalid source type" },
        { status: 400 }
      )
    }

    if (sourceRooms.length === 0) {
      return NextResponse.json(
        { error: "No rooms found to copy" },
        { status: 404 }
      )
    }

    // Get current max order for template rooms
    const existingRooms = await prisma.templateRoom.findMany({
      where: { templateId: params.id },
      orderBy: { order: "desc" },
      take: 1,
    })

    const nextOrder = existingRooms.length > 0 ? existingRooms[0].order + 1 : 0

    // Create template rooms from source
    const createdRooms = []
    for (let i = 0; i < sourceRooms.length; i++) {
      const sourceRoom = sourceRooms[i]
      const templateRoom = await prisma.templateRoom.create({
        data: {
          templateId: params.id,
          name: sourceRoom.name,
          type: sourceRoom.type || null,
          order: nextOrder + i,
          templateComponents: sourceRoom.components
            ? {
                create: sourceRoom.components.map((comp: any) => ({
                  componentType: comp.componentType,
                  componentName: comp.componentName || null,
                  condition: comp.condition || null,
                  materialId: comp.materialId || null,
                  vendorId: comp.vendorId || null,
                  quantity: comp.quantity || 1,
                  unitCost: comp.unitCost || 0,
                  notes: comp.notes || null,
                })),
              }
            : undefined,
        },
        include: {
          templateComponents: true,
        },
      })
      createdRooms.push(templateRoom)
    }

    return NextResponse.json(createdRooms, { status: 201 })
  } catch (error: any) {
    console.error("Error copying rooms to template:", error)
    return NextResponse.json(
      { error: "Failed to copy rooms to template" },
      { status: 500 }
    )
  }
}

