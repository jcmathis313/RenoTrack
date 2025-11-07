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
    const { name, order } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verify category belongs to user's tenant
    const existing = await prisma.componentCategory.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Component category not found" },
        { status: 404 }
      )
    }

    const category = await prisma.componentCategory.update({
      where: { id: params.id },
      data: {
        name,
        order: order ?? existing.order,
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error("Error updating component category:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component category with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update component category" },
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

    // Verify category belongs to user's tenant
    const category = await prisma.componentCategory.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Component category not found" },
        { status: 404 }
      )
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default component category" },
        { status: 400 }
      )
    }

    await prisma.componentCategory.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting component category:", error)
    return NextResponse.json(
      { error: "Failed to delete component category" },
      { status: 500 }
    )
  }
}
