import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, componentType, componentName, condition, notes } = body

    if (!roomId || !componentType || !condition) {
      return NextResponse.json(
        { error: "Room ID, component type, and condition are required" },
        { status: 400 }
      )
    }

    // Verify room belongs to an assessment in user's tenant
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        assessment: {
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

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or access denied" },
        { status: 404 }
      )
    }

    const componentAssessment = await prisma.componentAssessment.create({
      data: {
        roomId,
        componentType: componentType.trim(),
        componentName: componentName?.trim() || null,
        condition: condition.trim(),
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(componentAssessment, { status: 201 })
  } catch (error: any) {
    console.error("Error creating component assessment:", error)
    return NextResponse.json(
      { error: "Failed to create component assessment" },
      { status: 500 }
    )
  }
}
