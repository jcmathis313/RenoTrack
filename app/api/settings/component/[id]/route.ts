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

    // Verify component belongs to user's tenant
    const existing = await prisma.component.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      )
    }

    const component = await prisma.component.update({
      where: { id: params.id },
      data: {
        name,
        order: order ?? existing.order,
      },
    })

    return NextResponse.json(component)
  } catch (error: any) {
    console.error("Error updating component:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component with this name already exists in this category" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update component" },
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

    // Verify component belongs to user's tenant
    const component = await prisma.component.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      )
    }

    // Don't allow deleting default components
    if (component.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default component" },
        { status: 400 }
      )
    }

    await prisma.component.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting component:", error)
    return NextResponse.json(
      { error: "Failed to delete component" },
      { status: 500 }
    )
  }
}
