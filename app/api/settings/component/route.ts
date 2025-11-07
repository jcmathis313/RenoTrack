import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


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

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    const where: any = { tenantId: user.tenantId }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const components = await prisma.component.findMany({
      where,
      orderBy: { order: "asc" },
    })

    return NextResponse.json(components)
  } catch (error: any) {
    console.error("Error fetching components:", error)
    const errorMessage = error?.message || "Failed to fetch components"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { name, categoryId, order } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Verify category belongs to user's tenant
    const category = await prisma.componentCategory.findFirst({
      where: {
        id: categoryId,
        tenantId: user.tenantId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Component category not found" },
        { status: 404 }
      )
    }

    const component = await prisma.component.create({
      data: {
        tenantId: user.tenantId,
        categoryId,
        name: name.trim(),
        order: order ?? 0,
        isDefault: false,
      },
    })

    return NextResponse.json(component, { status: 201 })
  } catch (error: any) {
    console.error("Error creating component:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component with this name already exists in this category" },
        { status: 409 }
      )
    }
    
    const errorMessage = error?.message || "Failed to create component"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
