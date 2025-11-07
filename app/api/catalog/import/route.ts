import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Parse CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current) // Push last field
  return result
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
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header row and one data row" },
        { status: 400 }
      )
    }

    // Parse header row
    const headerRow = parseCSVLine(lines[0])
    const expectedHeaders = [
      "Category",
      "Component",
      "Description",
      "Model Number",
      "Manufacturer",
      "Finish",
      "Color",
      "Image URL",
    ]

    // Validate headers (case-insensitive)
    const normalizedHeaders = headerRow.map((h) => h.trim().toLowerCase())
    const normalizedExpected = expectedHeaders.map((h) => h.toLowerCase())

    const headerMap: { [key: string]: number } = {}
    expectedHeaders.forEach((expected, index) => {
      const foundIndex = normalizedHeaders.findIndex(
        (h) => h === expected.toLowerCase()
      )
      if (foundIndex === -1) {
        throw new Error(`Missing required column: ${expected}`)
      }
      headerMap[expected] = foundIndex
    })

    // Get all categories and components for the tenant
    let categories = await prisma.componentCategory.findMany({
      where: { tenantId: user.tenantId },
      include: {
        components: {
          where: { tenantId: user.tenantId },
        },
      },
      orderBy: { order: "asc" },
    })

    // Helper function to refresh category map
    const refreshCategoryMap = () => {
      const map = new Map<string, { id: string; components: Map<string, string> }>()
      categories.forEach((cat) => {
        const componentMap = new Map<string, string>()
        cat.components.forEach((comp) => {
          componentMap.set(comp.name.toLowerCase(), comp.id)
        })
        map.set(cat.name.toLowerCase(), {
          id: cat.id,
          components: componentMap,
        })
      })
      return map
    }

    // Create lookup maps
    let categoryMap = refreshCategoryMap()

    // Helper function to get or create category
    const getOrCreateCategory = async (categoryName: string) => {
      const categoryLower = categoryName.toLowerCase()
      let categoryData = categoryMap.get(categoryLower)
      
      if (!categoryData) {
        // Get the highest order value
        const maxOrder = categories.length > 0 
          ? Math.max(...categories.map(c => c.order)) 
          : -1
        
        // Create new category
        const newCategory = await prisma.componentCategory.create({
          data: {
            tenantId: user.tenantId,
            name: categoryName.trim(),
            order: maxOrder + 1,
            isDefault: false,
          },
          include: {
            components: {
              where: { tenantId: user.tenantId },
            },
          },
        })
        
        // Refresh categories list and map
        categories = await prisma.componentCategory.findMany({
          where: { tenantId: user.tenantId },
          include: {
            components: {
              where: { tenantId: user.tenantId },
            },
          },
          orderBy: { order: "asc" },
        })
        categoryMap = refreshCategoryMap()
        
        categoryData = categoryMap.get(categoryLower)
      }
      
      return categoryData!
    }

    // Helper function to get or create component
    const getOrCreateComponent = async (categoryData: { id: string; components: Map<string, string> }, componentName: string) => {
      const componentLower = componentName.toLowerCase()
      let componentId = categoryData.components.get(componentLower)
      
      if (!componentId) {
        // Get the highest order value for components in this category
        const categoryComponents = categories
          .find(c => c.id === categoryData.id)?.components || []
        const maxOrder = categoryComponents.length > 0
          ? Math.max(...categoryComponents.map(c => c.order))
          : -1
        
        // Create new component
        const newComponent = await prisma.component.create({
          data: {
            tenantId: user.tenantId,
            categoryId: categoryData.id,
            name: componentName.trim(),
            order: maxOrder + 1,
            isDefault: false,
          },
        })
        
        // Update the component map
        categoryData.components.set(componentLower, newComponent.id)
        componentId = newComponent.id
        
        // Refresh categories list to include new component
        categories = await prisma.componentCategory.findMany({
          where: { tenantId: user.tenantId },
          include: {
            components: {
              where: { tenantId: user.tenantId },
            },
          },
          orderBy: { order: "asc" },
        })
      }
      
      return componentId
    }

    const results = {
      success: 0,
      errors: [] as { row: number; error: string }[],
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)

        const categoryName = values[headerMap["Category"]]?.trim()
        const componentName = values[headerMap["Component"]]?.trim()
        const description = values[headerMap["Description"]]?.trim() || null
        const modelNumber = values[headerMap["Model Number"]]?.trim() || null
        const manufacturer = values[headerMap["Manufacturer"]]?.trim() || null
        const finish = values[headerMap["Finish"]]?.trim() || null
        const color = values[headerMap["Color"]]?.trim() || null
        const imageUrl = values[headerMap["Image URL"]]?.trim() || null

        if (!categoryName || !componentName) {
          results.errors.push({
            row: i + 1,
            error: "Category and Component are required",
          })
          continue
        }

        // Get or create category
        const categoryData = await getOrCreateCategory(categoryName)
        
        // Get or create component
        const componentId = await getOrCreateComponent(categoryData, componentName)

        // Check if item already exists (same category, component, model number if provided)
        // If modelNumber is empty, use null for matching
        const existing = await prisma.catalogItem.findFirst({
          where: {
            tenantId: user.tenantId,
            categoryId: categoryData.id,
            componentId: componentId,
            modelNumber: modelNumber || null,
          },
        })

        if (existing) {
          // Fully overwrite existing item with all fields from CSV
          await prisma.catalogItem.update({
            where: { id: existing.id },
            data: {
              categoryId: categoryData.id,
              componentId: componentId,
              description,
              modelNumber: modelNumber || null,
              manufacturer,
              finish,
              color,
              imageUrl,
            },
          })
        } else {
          // Create new item
          await prisma.catalogItem.create({
            data: {
              tenantId: user.tenantId,
              categoryId: categoryData.id,
              componentId: componentId,
              description,
              modelNumber: modelNumber || null,
              manufacturer,
              finish,
              color,
              imageUrl,
            },
          })
        }

        results.success++
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.success,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error("Error importing catalog items:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import catalog items" },
      { status: 500 }
    )
  }
}
