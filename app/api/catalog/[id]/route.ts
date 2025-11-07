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
    const { categoryId, componentId, description, modelNumber, manufacturer, finish, color, imageUrl } = body

    // Verify catalog item belongs to user's tenant
    const existing = await prisma.catalogItem.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Catalog item not found or access denied" },
        { status: 404 }
      )
    }

    // If category or component changed, verify they belong to tenant
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.componentCategory.findFirst({
        where: {
          id: categoryId,
          tenantId: user.tenantId,
        },
      })
      if (!category) {
        return NextResponse.json(
          { error: "Category not found or access denied" },
          { status: 404 }
        )
      }
    }

    if (componentId && componentId !== existing.componentId) {
      const component = await prisma.component.findFirst({
        where: {
          id: componentId,
          tenantId: user.tenantId,
        },
      })
      if (!component) {
        return NextResponse.json(
          { error: "Component not found or access denied" },
          { status: 404 }
        )
      }
    }

    const catalogItem = await prisma.catalogItem.update({
      where: { id: params.id },
      data: {
        categoryId: categoryId ?? existing.categoryId,
        componentId: componentId ?? existing.componentId,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        modelNumber: modelNumber !== undefined ? (modelNumber?.trim() || null) : existing.modelNumber,
        manufacturer: manufacturer !== undefined ? (manufacturer?.trim() || null) : existing.manufacturer,
        finish: finish !== undefined ? (finish?.trim() || null) : existing.finish,
        color: color !== undefined ? (color?.trim() || null) : existing.color,
        imageUrl: imageUrl !== undefined ? (imageUrl?.trim() || null) : existing.imageUrl,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        component: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    })

    return NextResponse.json(catalogItem)
  } catch (error: any) {
    console.error("Error updating catalog item:", error)
    return NextResponse.json(
      { error: "Failed to update catalog item" },
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

    // Verify catalog item belongs to user's tenant
    const catalogItem = await prisma.catalogItem.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Catalog item not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.catalogItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting catalog item:", error)
    return NextResponse.json(
      { error: "Failed to delete catalog item" },
      { status: 500 }
    )
  }
}
