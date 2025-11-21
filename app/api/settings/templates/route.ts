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

    const templates = await prisma.template.findMany({
      where: { tenantId: user.tenantId },
      include: {
        templateRooms: {
          include: {
            templateComponents: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    
    // If table doesn't exist, return empty array instead of error
    if (error?.message?.includes("does not exist") || error?.code === "P2021" || error?.code === "42P01") {
      console.warn("Template table does not exist in database. Returning empty array.")
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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
    const { name, rooms } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        templateRooms: rooms
          ? {
              create: rooms.map((room: any, index: number) => ({
                name: room.name,
                type: room.type || null,
                order: index,
                templateComponents: room.components
                  ? {
                      create: room.components.map((component: any) => ({
                        componentType: component.componentType,
                        componentName: component.componentName || null,
                        condition: component.condition || null,
                        materialId: component.materialId || null,
                        vendorId: component.vendorId || null,
                        quantity: component.quantity || 1,
                        unitCost: component.unitCost || 0,
                        notes: component.notes || null,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        templateRooms: {
          include: {
            templateComponents: true,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template:", error)
    
    // Check if table doesn't exist
    if (error?.message?.includes("does not exist") || error?.code === "P2021" || error?.code === "42P01") {
      return NextResponse.json(
        { error: "Template table does not exist in database. Please run the SQL migration script in Supabase." },
        { status: 503 }
      )
    }
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to create template" },
      { status: 500 }
    )
  }
}

