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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
      )
    }

    const vendors = await prisma.vendor.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(vendors)
  } catch (error: any) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
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

    if (!user.tenantId) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 400 }
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

    const vendor = await prisma.vendor.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        contact: contact?.trim() || null,
        address: address?.trim() || null,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error: any) {
    console.error("Error creating vendor:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Vendor with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to create vendor" },
      { status: 500 }
    )
  }
}

