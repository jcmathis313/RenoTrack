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

    // Get all assessments for units belonging to the user's tenant
    const assessments = await prisma.assessment.findMany({
      where: {
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      include: {
        unit: {
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
          },
        },
        rooms: {
          include: {
            _count: {
              select: {
                componentAssessments: true,
              },
            },
          },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(assessments)
  } catch (error: any) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
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
    const { unitId, assessedBy, assessedAt } = body

    if (!unitId) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 }
      )
    }

    // Verify the unit belongs to the user's tenant
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        building: {
          community: {
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found or access denied" },
        { status: 404 }
      )
    }

    const assessment = await prisma.assessment.create({
      data: {
        unitId,
        assessedBy: assessedBy || null,
        assessedAt: assessedAt ? new Date(assessedAt) : new Date(),
      },
      include: {
        unit: {
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
          },
        },
      },
    })

    return NextResponse.json(assessment, { status: 201 })
  } catch (error: any) {
    console.error("Error creating assessment:", error)
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    )
  }
}
