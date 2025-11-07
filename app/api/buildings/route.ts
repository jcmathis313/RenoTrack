import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get("communityId")

    if (!communityId) {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 }
      )
    }

    // Verify community belongs to user's tenant
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        tenantId: user.tenantId,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    const buildings = await prisma.building.findMany({
      where: {
        communityId,
      },
      include: {
        _count: {
          select: {
            units: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(buildings)
  } catch (error) {
    console.error("Error fetching buildings:", error)
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
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
    const { name, address, communityId } = body

    if (!name || !communityId) {
      return NextResponse.json(
        { error: "Name and communityId are required" },
        { status: 400 }
      )
    }

    // Verify community belongs to user's tenant
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        tenantId: user.tenantId,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    const building = await prisma.building.create({
      data: {
        name,
        address: address || null,
        communityId,
      },
    })

    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    console.error("Error creating building:", error)
    return NextResponse.json(
      { error: "Failed to create building" },
      { status: 500 }
    )
  }
}
