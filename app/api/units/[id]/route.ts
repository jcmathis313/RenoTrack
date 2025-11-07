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
    const { number } = body

    if (!number) {
      return NextResponse.json(
        { error: "Number is required" },
        { status: 400 }
      )
    }

    // Verify unit belongs to user's tenant
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: {
          community: {
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        number,
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error("Error updating unit:", error)
    return NextResponse.json(
      { error: "Failed to update unit" },
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

    // Verify unit belongs to user's tenant
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: {
          community: {
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    await prisma.unit.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting unit:", error)
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    )
  }
}
