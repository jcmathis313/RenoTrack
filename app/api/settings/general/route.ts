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

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: user.tenantId,
          themeColor: "blue",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching general settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyName, businessAddress, themeColor } = body

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {
        companyName: companyName ?? undefined,
        businessAddress: businessAddress ?? undefined,
        themeColor: themeColor ?? undefined,
      },
      create: {
        tenantId: user.tenantId,
        companyName: companyName ?? null,
        businessAddress: businessAddress ?? null,
        themeColor: themeColor ?? "blue",
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating general settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
