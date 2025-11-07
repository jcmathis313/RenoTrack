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
      console.error("GET /api/settings/quality-status: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.tenantId) {
      console.error("GET /api/settings/quality-status: User has no tenantId", user)
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    console.log("GET /api/settings/quality-status: Fetching for tenantId:", user.tenantId)

    const statuses = await prisma.qualityStatus.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { order: "asc" },
    })

    console.log(`GET /api/settings/quality-status: Found ${statuses.length} statuses`)
    return NextResponse.json(statuses)
  } catch (error: any) {
    console.error("Error fetching quality statuses:", error)
    console.error("Error stack:", error?.stack)
    console.error("Error message:", error?.message)
    const errorMessage = error?.message || "Failed to fetch quality statuses"
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

    const body = await request.json()
    const { name, order } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const status = await prisma.qualityStatus.create({
      data: {
        tenantId: user.tenantId,
        name,
        order: order ?? 0,
        isDefault: false,
      },
    })

    return NextResponse.json(status, { status: 201 })
  } catch (error: any) {
    console.error("Error creating quality status:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Quality status with this name already exists" },
        { status: 409 }
      )
    }
    // Include the actual error message for debugging
    const errorMessage = error?.message || "Failed to create quality status"
    console.error("Detailed error:", errorMessage, error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
