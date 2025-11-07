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

    const catalogItems = await prisma.catalogItem.findMany({
      where: { tenantId: user.tenantId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        component: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { category: { order: "asc" } },
        { component: { order: "asc" } },
        { createdAt: "desc" },
      ],
    })

    // Create CSV header
    const headers = [
      "Category",
      "Component",
      "Description",
      "Model Number",
      "Manufacturer",
      "Finish",
      "Color",
      "Image URL",
    ]

    // Create CSV rows
    const rows = catalogItems.map((item) => [
      item.category.name,
      item.component.name,
      item.description || "",
      item.modelNumber || "",
      item.manufacturer || "",
      item.finish || "",
      item.color || "",
      item.imageUrl || "",
    ])

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    // Combine header and rows
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n")

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="catalog-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting catalog items:", error)
    return NextResponse.json(
      { error: "Failed to export catalog items" },
      { status: 500 }
    )
  }
}
