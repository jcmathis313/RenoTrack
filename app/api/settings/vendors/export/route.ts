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

    // Generate CSV content
    const csvHeader = "Vendor Name,Vendor Contact,Vendor Address\n"
    const csvRows = vendors.map((vendor) => {
      const name = vendor.name.replace(/"/g, '""') // Escape double quotes
      const contact = (vendor.contact || "").replace(/"/g, '""')
      const address = (vendor.address || "").replace(/"/g, '""')
      return `"${name}","${contact}","${address}"`
    })

    const csvContent = csvHeader + csvRows.join("\n")

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="vendors-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting vendors:", error)
    return NextResponse.json(
      { error: "Failed to export vendors" },
      { status: 500 }
    )
  }
}

