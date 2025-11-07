import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


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
    const { componentType, componentName, condition, notes } = body

    if (!componentType || !condition) {
      return NextResponse.json(
        { error: "Component type and condition are required" },
        { status: 400 }
      )
    }

    // Verify component assessment belongs to user's tenant
    const existing = await prisma.componentAssessment.findFirst({
      where: {
        id: params.id,
        room: {
          assessment: {
            unit: {
              building: {
                community: {
                  tenantId: user.tenantId,
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Component assessment not found or access denied" },
        { status: 404 }
      )
    }

    const componentAssessment = await prisma.componentAssessment.update({
      where: { id: params.id },
      data: {
        componentType: componentType.trim(),
        componentName: componentName?.trim() || null,
        condition: condition.trim(),
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(componentAssessment)
  } catch (error: any) {
    console.error("Error updating component assessment:", error)
    return NextResponse.json(
      { error: "Failed to update component assessment" },
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

    // Verify component assessment belongs to user's tenant
    const componentAssessment = await prisma.componentAssessment.findFirst({
      where: {
        id: params.id,
        room: {
          assessment: {
            unit: {
              building: {
                community: {
                  tenantId: user.tenantId,
                },
              },
            },
          },
        },
      },
    })

    if (!componentAssessment) {
      return NextResponse.json(
        { error: "Component assessment not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.componentAssessment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting component assessment:", error)
    return NextResponse.json(
      { error: "Failed to delete component assessment" },
      { status: 500 }
    )
  }
}
