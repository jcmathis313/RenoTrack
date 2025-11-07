import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { name, order, color } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verify status belongs to user's tenant
    const existing = await prisma.componentStatus.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Component status not found" },
        { status: 404 }
      )
    }

    const updateData: any = {
      name,
      order: order ?? existing.order,
    }
    if (color !== undefined) {
      updateData.color = color
    }

    const status = await prisma.componentStatus.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(status)
  } catch (error: any) {
    console.error("Error updating component status:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component status with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update component status" },
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

    // Verify status belongs to user's tenant
    const status = await prisma.componentStatus.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!status) {
      return NextResponse.json(
        { error: "Component status not found" },
        { status: 404 }
      )
    }

    // Don't allow deleting default statuses
    if (status.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default component status" },
        { status: 400 }
      )
    }

    await prisma.componentStatus.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting component status:", error)
    return NextResponse.json(
      { error: "Failed to delete component status" },
      { status: 500 }
    )
  }
}
