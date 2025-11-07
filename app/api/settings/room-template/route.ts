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

    const rooms = await prisma.roomTemplate.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(rooms)
  } catch (error: any) {
    console.error("Error fetching room templates:", error)
    const errorMessage = error?.message || "Failed to fetch room templates"
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

    const room = await prisma.roomTemplate.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        order: order ?? 0,
        isDefault: false,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error("Error creating room template:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Room template with this name already exists" },
        { status: 409 }
      )
    }
    
    const errorMessage = error?.message || "Failed to create room template"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
