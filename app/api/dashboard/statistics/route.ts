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

    // Get YTD date range (January 1 to today)
    const today = new Date()
    const yearStart = new Date(today.getFullYear(), 0, 1) // January 1st

    // Helper function to get data grouped by month
    const getMonthlyData = async (
      model: any,
      whereClause: any,
      dateField: string = 'createdAt'
    ) => {
      const items = await model.findMany({
        where: {
          ...whereClause,
          [dateField]: {
            gte: yearStart,
            lte: today,
          },
        },
        select: {
          [dateField]: true,
        },
      })

      // Group by month
      const monthlyData: Record<string, number> = {}
      for (let month = 0; month < 12; month++) {
        const monthKey = `${today.getFullYear()}-${String(month + 1).padStart(2, '0')}`
        monthlyData[monthKey] = 0
      }

      items.forEach((item: any) => {
        const date = new Date(item[dateField])
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++
        }
      })

      // Convert to array format for charts
      return Object.entries(monthlyData)
        .map(([monthKey, count]) => {
          const [year, month] = monthKey.split('-')
          const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
          return {
            month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
            count: count as number,
            monthIndex: parseInt(month) - 1,
          }
        })
        .filter(item => {
          const currentMonth = today.getMonth()
          return item.monthIndex <= currentMonth
        })
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(({ month, count }) => ({ month, count }))
    }

    // Get Active Assessments (YTD)
    const assessmentsData = await getMonthlyData(
      prisma.assessment,
      {
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      'createdAt'
    )

    // Get Active Selections (DesignProjects) (YTD)
    const selectionsData = await getMonthlyData(
      prisma.designProject,
      {
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      'createdAt'
    )

    // Get Active Inspections (YTD)
    const inspectionsData = await getMonthlyData(
      prisma.inspection,
      {
        designProject: {
          unit: {
            building: {
              community: {
                tenantId: user.tenantId,
              },
            },
          },
        },
      },
      'createdAt'
    )

    return NextResponse.json({
      assessments: assessmentsData,
      selections: selectionsData,
      inspections: inspectionsData,
    })
  } catch (error: any) {
    console.error("Error fetching dashboard statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error?.message },
      { status: 500 }
    )
  }
}

