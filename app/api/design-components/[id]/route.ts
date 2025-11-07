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

    const componentId = params.id
    const body = await request.json()
    const { componentType, componentName, condition, materialId, vendorId, quantity, unitCost, residentUpgrade, notes } = body

    // Verify component belongs to user's tenant
    const existingComponent = await prisma.designComponent.findFirst({
      where: {
        id: componentId,
        designRoom: {
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
      },
    })

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Design component not found or access denied" },
        { status: 404 }
      )
    }

    const updatedQuantity = quantity ?? existingComponent.quantity
    const updatedUnitCost = unitCost ?? existingComponent.unitCost

    // Handle residentUpgrade: convert boolean or null
    let residentUpgradeValue: boolean | null = null
    if (residentUpgrade === true || residentUpgrade === "true") {
      residentUpgradeValue = true
    } else if (residentUpgrade === false || residentUpgrade === "false") {
      residentUpgradeValue = false
    }

    const updatedComponent = await prisma.designComponent.update({
      where: { id: componentId },
      data: {
        componentType: componentType?.trim() || existingComponent.componentType,
        componentName: componentName?.trim() || null,
        condition: condition?.trim() || null,
        materialId: materialId || null,
        vendorId: vendorId || null,
        quantity: updatedQuantity,
        unitCost: updatedUnitCost,
        totalCost: updatedQuantity * updatedUnitCost,
        residentUpgrade: residentUpgradeValue,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(updatedComponent)
  } catch (error: any) {
    console.error("Error updating design component:", error)
    return NextResponse.json(
      { error: "Failed to update design component" },
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

    const componentId = params.id

    // Verify component belongs to user's tenant
    const existingComponent = await prisma.designComponent.findFirst({
      where: {
        id: componentId,
        designRoom: {
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
      },
    })

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Design component not found or access denied" },
        { status: 404 }
      )
    }

    await prisma.designComponent.delete({
      where: { id: componentId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting design component:", error)
    return NextResponse.json(
      { error: "Failed to delete design component" },
      { status: 500 }
    )
  }
}
