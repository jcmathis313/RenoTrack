import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assessmentId = params.id

    if (!assessmentId) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      )
    }

    console.log("Fetching assessment with ID:", assessmentId, "for tenant:", user.tenantId)

    // First, let's check if the assessment exists at all
    const assessmentExists = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, unitId: true },
    })

    if (!assessmentExists) {
      console.log("Assessment not found in database:", assessmentId)
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      )
    }

    // Then check if it belongs to the user's tenant
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
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
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        rooms: {
          include: {
            componentAssessments: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!assessment) {
      console.log("Assessment found but doesn't belong to tenant:", assessmentId, "Tenant ID:", user.tenantId)
      return NextResponse.json(
        { error: "Assessment not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error("Error fetching assessment:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: "Failed to fetch assessment", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
