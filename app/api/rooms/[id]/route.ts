import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { order } = body

    // Verify room belongs to user's tenant
    const room = await prisma.room.findFirst({
      where: {
        id: params.id,
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

    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: { order: order ?? room.order },
    })

    return NextResponse.json(updatedRoom)
  } catch (error: any) {
    console.error("Error updating room order:", error)
    return NextResponse.json(
      { error: "Failed to update room order" },
      { status: 500 }
    )
  }
}
