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
    const { assessmentId, name, type } = body

    if (!assessmentId || !name) {
      return NextResponse.json(
        { error: "Assessment ID and name are required" },
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

    // Set order to be the last room's order + 1, or 0 if no rooms exist
    const nextOrder = assessment.rooms.length > 0 ? assessment.rooms[0].order + 1 : 0

    const room = await prisma.room.create({
      data: {
        assessmentId,
        name: name.trim(),
        type: type || null,
        order: nextOrder,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error("Error creating room:", error)
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}
