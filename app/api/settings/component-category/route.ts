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

    const categories = await prisma.componentCategory.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { order: "asc" },
      include: {
        components: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    console.error("Error fetching component categories:", error)
    const errorMessage = error?.message || "Failed to fetch component categories"
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
    const { name, order } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const category = await prisma.componentCategory.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        order: order ?? 0,
        isDefault: false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Error creating component category:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component category with this name already exists" },
        { status: 409 }
      )
    }
    
    const errorMessage = error?.message || "Failed to create component category"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
