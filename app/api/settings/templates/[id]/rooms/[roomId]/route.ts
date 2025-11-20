import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
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
    const { name, type } = body

    // Verify template room belongs to user's tenant
    const templateRoom = await prisma.templateRoom.findFirst({
      where: {
        id: params.roomId,
        template: {
          id: params.id,
          tenantId: user.tenantId,
        },
      },
    })

    if (!templateRoom) {
      return NextResponse.json(
        { error: "Template room not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.templateRoom.update({
      where: { id: params.roomId },
      data: {
        name: name ? name.trim() : undefined,
        type: type !== undefined ? (type || null) : undefined,
      },
      include: {
        templateComponents: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating template room:", error)
    return NextResponse.json(
      { error: "Failed to update template room" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
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

    // Verify template room belongs to user's tenant
    const templateRoom = await prisma.templateRoom.findFirst({
      where: {
        id: params.roomId,
        template: {
          id: params.id,
          tenantId: user.tenantId,
        },
      },
    })

    if (!templateRoom) {
      return NextResponse.json(
        { error: "Template room not found" },
        { status: 404 }
      )
    }

    await prisma.templateRoom.delete({
      where: { id: params.roomId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting template room:", error)
    return NextResponse.json(
      { error: "Failed to delete template room" },
      { status: 500 }
    )
  }
}

