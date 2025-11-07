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
    const { name, address, logoUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verify community belongs to user's tenant
    const existingCommunity = await prisma.community.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existingCommunity) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    const community = await prisma.community.update({
      where: { id: params.id },
      data: {
        name,
        address: address || null,
        logoUrl: logoUrl || null,
      },
    })

    return NextResponse.json(community)
  } catch (error) {
    console.error("Error updating community:", error)
    return NextResponse.json(
      { error: "Failed to update community" },
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

    // Verify community belongs to user's tenant
    const community = await prisma.community.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    await prisma.community.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting community:", error)
    return NextResponse.json(
      { error: "Failed to delete community" },
      { status: 500 }
    )
  }
}
