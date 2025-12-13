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
    const { name, type } = body

    // Verify design room belongs to user's tenant
    const designRoom = await prisma.designRoom.findFirst({
      where: {
        id: params.id,
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

    const updateData: { name?: string; type?: string | null } = {}
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (type !== undefined) {
      updateData.type = type || null
    }

    const updatedRoom = await prisma.designRoom.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedRoom)
  } catch (error: any) {
    console.error("Error updating design room:", error)
    return NextResponse.json(
      { error: "Failed to update design room" },
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

    // Verify design room belongs to user's tenant
    const designRoom = await prisma.designRoom.findFirst({
      where: {
        id: params.id,
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

    await prisma.designRoom.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting design room:", error)
    return NextResponse.json(
      { error: "Failed to delete design room" },
      { status: 500 }
    )
  }
}





