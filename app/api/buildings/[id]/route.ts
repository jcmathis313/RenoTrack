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
    const { name, address } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verify building belongs to user's tenant
    const existingBuilding = await prisma.building.findFirst({
      where: {
        id: params.id,
        community: {
          tenantId: user.tenantId,
        },
      },
    })

    if (!existingBuilding) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      )
    }

    const building = await prisma.building.update({
      where: { id: params.id },
      data: {
        name,
        address: address || null,
      },
    })

    return NextResponse.json(building)
  } catch (error) {
    console.error("Error updating building:", error)
    return NextResponse.json(
      { error: "Failed to update building" },
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

    // Verify building belongs to user's tenant
    const building = await prisma.building.findFirst({
      where: {
        id: params.id,
        community: {
          tenantId: user.tenantId,
        },
      },
    })

    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      )
    }

    await prisma.building.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting building:", error)
    return NextResponse.json(
      { error: "Failed to delete building" },
      { status: 500 }
    )
  }
}
