import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { componentIds, updates } = body

    if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
      return NextResponse.json(
        { error: "componentIds array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      )
    }

    // Verify all components belong to user's tenant
    const components = await prisma.designComponent.findMany({
      where: {
        id: { in: componentIds },
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
      include: {
        designRoom: {
          include: {
            designProject: {
              include: {
                unit: {
                  include: {
                    building: {
                      include: {
                        community: {
                          select: {
                            tenantId: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (components.length !== componentIds.length) {
      return NextResponse.json(
        { error: "Some components not found or access denied" },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Handle vendorId
    if ("vendorId" in updates) {
      updateData.vendorId = updates.vendorId === null || updates.vendorId === "__none__" || updates.vendorId === "" ? null : updates.vendorId
    }

    // Handle condition
    if ("condition" in updates) {
      updateData.condition = updates.condition === null || updates.condition === "" ? null : updates.condition?.trim() || null
    }

    // Handle residentUpgrade
    if ("residentUpgrade" in updates) {
      if (updates.residentUpgrade === true || updates.residentUpgrade === "upgrade") {
        updateData.residentUpgrade = true
      } else if (updates.residentUpgrade === false || updates.residentUpgrade === "included") {
        updateData.residentUpgrade = false
      } else if (updates.residentUpgrade === null || updates.residentUpgrade === "__clear__") {
        updateData.residentUpgrade = null
      }
    }

    // Handle quantity
    if ("quantity" in updates && updates.quantity !== undefined && updates.quantity !== null) {
      const quantity = parseFloat(updates.quantity)
      if (!isNaN(quantity) && quantity >= 0) {
        updateData.quantity = quantity
      }
    }

    // Handle unitCost
    if ("unitCost" in updates && updates.unitCost !== undefined && updates.unitCost !== null) {
      const unitCost = parseFloat(updates.unitCost)
      if (!isNaN(unitCost) && unitCost >= 0) {
        updateData.unitCost = unitCost
      }
    }

    // Calculate totalCost if quantity or unitCost is being updated
    // We need to update individually to recalculate totalCost correctly
    if (updateData.quantity !== undefined || updateData.unitCost !== undefined) {
      // Update each component individually to get the correct totalCost calculation
      const updatePromises = components.map(async (component) => {
        const componentUpdateData: any = { ...updateData }
        const finalQuantity = componentUpdateData.quantity !== undefined ? componentUpdateData.quantity : component.quantity
        const finalUnitCost = componentUpdateData.unitCost !== undefined ? componentUpdateData.unitCost : component.unitCost
        componentUpdateData.totalCost = finalQuantity * finalUnitCost

        return prisma.designComponent.update({
          where: { id: component.id },
          data: componentUpdateData,
        })
      })

      const updatedComponents = await Promise.all(updatePromises)
      return NextResponse.json({ 
        success: true, 
        updated: updatedComponents.length,
      })
    } else {
      // No quantity or price updates, can use updateMany for efficiency
      const result = await prisma.designComponent.updateMany({
        where: {
          id: { in: componentIds },
        },
        data: updateData,
      })

      return NextResponse.json({ 
        success: true, 
        updated: result.count 
      })
    }
  } catch (error: any) {
    console.error("Error performing bulk update:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to perform bulk update" },
      { status: 500 }
    )
  }
}

