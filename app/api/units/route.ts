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

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get("buildingId")

    // Build where clause
    const where: any = {
      building: {
        community: {
          tenantId: user.tenantId,
        },
      },
    }

    // If buildingId is provided, filter by it
    if (buildingId) {
      where.buildingId = buildingId
      // Also verify building belongs to user's tenant
      const building = await prisma.building.findFirst({
        where: {
          id: buildingId,
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
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ...(buildingId
          ? {
              _count: {
                select: {
                  assessments: true,
                  designProjects: true,
                },
              },
            }
          : {}),
      },
      orderBy: buildingId
        ? { number: "asc" }
        : {
            building: {
              community: {
                name: "asc",
              },
            },
          },
    })

    return NextResponse.json(units)
  } catch (error: any) {
    console.error("Error fetching units:", error)
    return NextResponse.json(
      { error: "Failed to fetch units" },
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
    const { number, buildingId } = body

    if (!number || !buildingId) {
      return NextResponse.json(
        { error: "Number and buildingId are required" },
        { status: 400 }
      )
    }

    // Verify building belongs to user's tenant
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
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

    const unit = await prisma.unit.create({
      data: {
        number,
        buildingId,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error("Error creating unit:", error)
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    )
  }
}
