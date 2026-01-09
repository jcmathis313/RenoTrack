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
    const { assessmentId, templateRoomIds } = body

    if (!assessmentId || !templateRoomIds || !Array.isArray(templateRoomIds)) {
      return NextResponse.json(
        { error: "Assessment ID and template room IDs are required" },
        { status: 400 }
      )
    }

    // Verify assessment belongs to user's tenant
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      include: {
        rooms: {
          select: { order: true },
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    })

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found or access denied" },
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

    // Get the next order value
    const nextOrder = assessment.rooms.length > 0 ? assessment.rooms[0].order + 1 : 0

    // Create rooms from template rooms
    const createdRooms = []
    for (let i = 0; i < templateRooms.length; i++) {
      const templateRoom = templateRooms[i]
      const room = await prisma.room.create({
        data: {
          assessmentId,
          name: templateRoom.name,
          type: templateRoom.type || null,
          order: nextOrder + i,
          componentAssessments: {
            create: templateRoom.templateComponents.map((tc) => ({
              componentType: tc.componentType,
              componentName: tc.componentName || null,
              condition: tc.condition || "Keep", // Default to "Keep" if no condition in template
              notes: tc.notes || null,
            })),
          },
        },
        include: {
          componentAssessments: true,
        },
      })
      createdRooms.push(room)
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






