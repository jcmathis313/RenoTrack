import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    const catalogItems = await prisma.catalogItem.findMany({
      where: { tenantId: user.tenantId },
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
      orderBy: [
        { category: { order: "asc" } },
        { component: { order: "asc" } },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(catalogItems)
  } catch (error: any) {
    console.error("Error fetching catalog items:", error)
    return NextResponse.json(
      { error: "Failed to fetch catalog items" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/catalog: Starting request")
    const user = await getCurrentUser()
    if (!user) {
      console.log("POST /api/catalog: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.tenantId) {
      console.log("POST /api/catalog: No tenantId found")
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log("POST /api/catalog: Request body:", body)
    const { categoryId, componentId, description, modelNumber, manufacturer, finish, color, imageUrl } = body

    if (!categoryId || !componentId) {
      console.log("POST /api/catalog: Missing categoryId or componentId")
      return NextResponse.json(
        { error: "Category and Component are required" },
        { status: 400 }
      )
    }

    // Verify category and component belong to user's tenant
    console.log(`POST /api/catalog: Looking up category ${categoryId} for tenant ${user.tenantId}`)
    const category = await prisma.componentCategory.findFirst({
      where: {
        id: categoryId,
        tenantId: user.tenantId,
      },
    })

    console.log(`POST /api/catalog: Category found:`, category ? category.name : "NOT FOUND")

    console.log(`POST /api/catalog: Looking up component ${componentId} for category ${categoryId} and tenant ${user.tenantId}`)
    const component = await prisma.component.findFirst({
      where: {
        id: componentId,
        categoryId: categoryId,
        tenantId: user.tenantId,
      },
    })

    console.log(`POST /api/catalog: Component found:`, component ? component.name : "NOT FOUND")

    if (!category || !component) {
      console.log("POST /api/catalog: Category or Component not found")
      return NextResponse.json(
        { error: "Category or Component not found or access denied" },
        { status: 404 }
      )
    }

    console.log("POST /api/catalog: Creating catalog item...")
    const catalogItem = await prisma.catalogItem.create({
      data: {
        tenantId: user.tenantId,
        categoryId,
        componentId,
        description: description && description.trim() ? description.trim() : null,
        modelNumber: modelNumber && modelNumber.trim() ? modelNumber.trim() : null,
        manufacturer: manufacturer && manufacturer.trim() ? manufacturer.trim() : null,
        finish: finish && finish.trim() ? finish.trim() : null,
        color: color && color.trim() ? color.trim() : null,
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
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

    return NextResponse.json(catalogItem, { status: 201 })
  } catch (error: any) {
    console.error("Error creating catalog item:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Provide more specific error messages
    let errorMessage = "Failed to create catalog item"
    if (error?.code === "P2002") {
      errorMessage = "A catalog item with these specifications already exists"
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
