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
    const { name, order } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verify room template belongs to user's tenant
    const existing = await prisma.roomTemplate.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Room template not found" },
        { status: 404 }
      )
    }

    const room = await prisma.roomTemplate.update({
      where: { id: params.id },
      data: {
        name,
        order: order ?? existing.order,
      },
    })

    return NextResponse.json(room)
  } catch (error: any) {
    console.error("Error updating room template:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Room template with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update room template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify room template belongs to user's tenant
    const room = await prisma.roomTemplate.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Room template not found" },
        { status: 404 }
      )
    }

    // Don't allow deleting default rooms
    if (room.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default room template" },
        { status: 400 }
      )
    }

    await prisma.roomTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting room template:", error)
    return NextResponse.json(
      { error: "Failed to delete room template" },
      { status: 500 }
    )
  }
}
