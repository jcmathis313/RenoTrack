import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const [tenantCount, userCount, communityCount, buildingCount, unitCount, assessmentCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.community.count(),
      prisma.building.count(),
      prisma.unit.count(),
      prisma.assessment.count(),
    ])

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await prisma.activityLog.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get tenants with user counts
    const tenantsWithUserCounts = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            communities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      overview: {
        tenants: tenantCount,
        users: userCount,
        communities: communityCount,
        buildings: buildingCount,
        units: unitCount,
        assessments: assessmentCount,
        recentActivity,
      },
      tenants: tenantsWithUserCounts,
    })
  } catch (error: any) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}



