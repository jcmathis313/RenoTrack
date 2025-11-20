import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple CSV parser
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ""
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim())
      currentCell = ""
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim())
        currentCell = ""
        rows.push(currentRow)
        currentRow = []
      }
      // Skip \r\n
      if (char === '\r' && nextChar === '\n') {
        i++
      }
    } else {
      currentCell += char
    }
  }

  // Add last cell and row if any
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }

  return rows
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

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      )
    }

    // Skip header row if it matches expected headers
    const headerRow = rows[0]
    const isHeader = headerRow[0]?.toLowerCase().includes("vendor name") ||
                     headerRow[0]?.toLowerCase().includes("name")

    const dataRows = isHeader ? rows.slice(1) : rows

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + (isHeader ? 2 : 1) // 1-indexed, accounting for header

      if (row.length === 0 || row.every((cell) => !cell.trim())) {
        // Skip empty rows
        continue
      }

      const name = row[0]?.trim()
      const contact = row[1]?.trim() || null
      const address = row[2]?.trim() || null

      if (!name) {
        errors.push(`Row ${rowNumber}: Vendor name is required`)
        skipped++
        continue
      }

      try {
        await prisma.vendor.create({
          data: {
            tenantId: user.tenantId,
            name,
            contact,
            address,
          },
        })
        imported++
      } catch (error: any) {
        if (error.code === "P2002") {
          // Duplicate vendor name
          skipped++
          errors.push(`Row ${rowNumber}: Vendor "${name}" already exists`)
        } else {
          skipped++
          errors.push(`Row ${rowNumber}: ${error.message || "Failed to import"}`)
        }
      }
    }

    return NextResponse.json({
      count: imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Error importing vendors:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to import vendors" },
      { status: 500 }
    )
  }
}

