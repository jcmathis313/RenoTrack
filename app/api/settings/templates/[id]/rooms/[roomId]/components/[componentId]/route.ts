import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string; componentId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      componentType,
      componentName,
      condition,
      materialId,
      vendorId,
      quantity,
      unitCost,
      notes,
    } = body

    // Verify template component belongs to user's tenant
    const templateComponent = await prisma.templateComponent.findFirst({
      where: {
        id: params.componentId,
        templateRoom: {
          id: params.roomId,
          template: {
            id: params.id,
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!templateComponent) {
      return NextResponse.json(
        { error: "Template component not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.templateComponent.update({
      where: { id: params.componentId },
      data: {
        componentType: componentType !== undefined ? componentType.trim() : undefined,
        componentName: componentName !== undefined ? (componentName?.trim() || null) : undefined,
        condition: condition !== undefined ? (condition?.trim() || null) : undefined,
        materialId: materialId !== undefined ? (materialId || null) : undefined,
        vendorId: vendorId !== undefined ? (vendorId || null) : undefined,
        quantity: quantity !== undefined ? quantity : undefined,
        unitCost: unitCost !== undefined ? unitCost : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating template component:", error)
    return NextResponse.json(
      { error: "Failed to update template component" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string; componentId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    // Verify template component belongs to user's tenant
    const templateComponent = await prisma.templateComponent.findFirst({
      where: {
        id: params.componentId,
        templateRoom: {
          id: params.roomId,
          template: {
            id: params.id,
            tenantId: user.tenantId,
          },
        },
      },
    })

    if (!templateComponent) {
      return NextResponse.json(
        { error: "Template component not found" },
        { status: 404 }
      )
    }

    await prisma.templateComponent.delete({
      where: { id: params.componentId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting template component:", error)
    return NextResponse.json(
      { error: "Failed to delete template component" },
      { status: 500 }
    )
  }
}

