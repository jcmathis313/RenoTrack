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

    // Verify inspection room belongs to user's tenant
    const inspectionRoom = await prisma.inspectionRoom.findFirst({
      where: {
        id: params.id,
        inspection: {
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
      },
    })

    if (!inspectionRoom) {
      return NextResponse.json(
        { error: "Inspection room not found or access denied" },
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

    const updatedRoom = await prisma.inspectionRoom.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedRoom)
  } catch (error: any) {
    console.error("Error updating inspection room:", error)
    return NextResponse.json(
      { error: "Failed to update inspection room" },
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

    // Verify inspection room belongs to user's tenant
    const inspectionRoom = await prisma.inspectionRoom.findFirst({
      where: {
        id: params.id,
        inspection: {
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
      },
    })

    if (!inspectionRoom) {
      return NextResponse.json(
        { error: "Inspection room not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.inspectionRoom.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting inspection room:", error)
    return NextResponse.json(
      { error: "Failed to delete inspection room" },
      { status: 500 }
    )
  }
}



