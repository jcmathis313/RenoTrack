import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/settings/component-status: Starting request")
    
    let user
    try {
      user = await getCurrentUser()
      console.log("GET /api/settings/component-status: getCurrentUser result:", user ? "User found" : "No user")
    } catch (authError: any) {
      console.error("GET /api/settings/component-status: Error getting user:", authError)
      console.error("Auth error stack:", authError?.stack)
      return NextResponse.json(
        { error: `Authentication error: ${authError?.message || "Unknown error"}` },
        { status: 500 }
      )
    }

    if (!user) {
      console.error("GET /api/settings/component-status: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.tenantId) {
      console.error("GET /api/settings/component-status: User has no tenantId", user)
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    console.log("GET /api/settings/component-status: Fetching for tenantId:", user.tenantId)

    let statuses
    try {
      statuses = await prisma.componentStatus.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { order: "asc" },
      })
      console.log(`GET /api/settings/component-status: Found ${statuses.length} statuses`)
      if (statuses.length > 0) {
        console.log(`GET /api/settings/component-status: First status sample:`, {
          id: statuses[0].id,
          name: statuses[0].name,
          color: statuses[0].color,
        })
      }
    } catch (prismaError: any) {
      console.error("GET /api/settings/component-status: Prisma error:", prismaError)
      console.error("Prisma error stack:", prismaError?.stack)
      throw prismaError
    }

    return NextResponse.json(statuses)
  } catch (error: any) {
    console.error("GET /api/settings/component-status: Unexpected error:", error)
    console.error("Error type:", error?.constructor?.name)
    console.error("Error stack:", error?.stack)
    console.error("Error message:", error?.message)
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    const errorMessage = error?.message || "Failed to fetch component statuses"
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
      console.error("User has no tenantId:", user)
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { name, order, color } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    console.log("Creating component status:", {
      tenantId: user.tenantId,
      name: name.trim(),
      order: order ?? 0,
      color: color || "gray",
    })

    const status = await prisma.componentStatus.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        color: color || "gray",
        order: order ?? 0,
        isDefault: false,
      },
    })

    return NextResponse.json(status, { status: 201 })
  } catch (error: any) {
    console.error("Error creating component status:", error)
    console.error("Error stack:", error?.stack)
    console.error("Error code:", error?.code)
    console.error("Error meta:", error?.meta)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Component status with this name already exists" },
        { status: 409 }
      )
    }
    
    // Include the actual error message for debugging
    const errorMessage = error?.message || error?.toString() || "Failed to create component status"
    console.error("Detailed error message:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
