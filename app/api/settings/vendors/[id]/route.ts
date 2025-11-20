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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const vendorId = resolvedParams.id

    // Verify vendor belongs to user's tenant
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        tenantId: user.tenantId,
      },
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, contact, address } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: name.trim(),
        contact: contact?.trim() || null,
        address: address?.trim() || null,
      },
    })

    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error("Error updating vendor:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Vendor with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to update vendor" },
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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const vendorId = resolvedParams.id

    // Verify vendor belongs to user's tenant
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        tenantId: user.tenantId,
      },
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Delete vendor (this will set vendorId to null in DesignComponents due to onDelete: SetNull)
    await prisma.vendor.delete({
      where: { id: vendorId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting vendor:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete vendor" },
      { status: 500 }
    )
  }
}

