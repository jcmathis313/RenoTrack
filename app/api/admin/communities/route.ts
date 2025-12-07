import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const where = tenantId ? { tenantId } : {}

    // Get building and unit counts for each community using a more efficient query
    const communitiesWithCounts = await prisma.community.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        buildings: {
          include: {
            _count: {
              select: {
                units: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate totals for each community
    const result = communitiesWithCounts.map((community) => {
      const unitCount = community.buildings.reduce(
        (sum, building) => sum + building._count.units,
        0
      )

      return {
        id: community.id,
        name: community.name,
        address: community.address,
        logoUrl: community.logoUrl,
        createdAt: community.createdAt,
        tenant: community.tenant,
        _count: {
          buildings: community.buildings.length,
          units: unitCount,
        },
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fetching communities:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch communities" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

