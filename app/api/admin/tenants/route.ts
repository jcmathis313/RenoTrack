import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            communities: true,
          },
        },
        settings: true,
        communities: {
          include: {
            buildings: {
              include: {
                _count: {
                  select: {
                    units: true,
                  },
                },
                units: {
                  include: {
                    _count: {
                      select: {
                        assessments: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate counts for buildings, units, and assessments
    const tenantsWithCounts = tenants.map((tenant) => {
      let buildingCount = 0
      let unitCount = 0
      let assessmentCount = 0

      tenant.communities.forEach((community) => {
        buildingCount += community.buildings.length
        community.buildings.forEach((building) => {
          unitCount += building._count.units
          building.units.forEach((unit) => {
            assessmentCount += unit._count.assessments
          })
        })
      })

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        _count: {
          users: tenant._count.users,
          communities: tenant._count.communities,
          buildings: buildingCount,
          units: unitCount,
          assessments: assessmentCount,
        },
        settings: tenant.settings,
      }
    })

    return NextResponse.json(tenantsWithCounts)
  } catch (error: any) {
    console.error("Error fetching tenants:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch tenants" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

