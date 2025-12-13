import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent activity (status changes only)
    const activities = await prisma.activityLog.findMany({
      where: {
        tenantId: user.tenantId,
        action: "status_changed",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Last 20 activities
    })

    // Format activities for display
    const formattedActivities = activities.map((activity) => {
      let entityName = ""
      let entityLink = ""

      // Build entity name and link based on type
      if (activity.entityType === "assessment") {
        entityName = `Assessment ${activity.entityId.slice(0, 8)}`
        entityLink = `/dashboard/assessments/${activity.entityId}`
      } else if (activity.entityType === "selection") {
        entityName = `Selection ${activity.entityId.slice(0, 8)}`
        entityLink = `/dashboard/selections/${activity.entityId}`
      } else if (activity.entityType === "inspection") {
        entityName = `Inspection ${activity.entityId.slice(0, 8)}`
        entityLink = `/dashboard/inspections/${activity.entityId}`
      }

      return {
        id: activity.id,
        entityType: activity.entityType,
        entityId: activity.entityId,
        entityName,
        entityLink,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
        description: activity.description,
        createdAt: activity.createdAt.toISOString(),
      }
    })

    return NextResponse.json(formattedActivities)
  } catch (error: any) {
    console.error("Error fetching activity feed:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity", details: error?.message },
      { status: 500 }
    )
  }
}





