import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, STORAGE_BUCKETS } from "@/lib/supabase"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> | { id: string; componentId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "File storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables." },
        { status: 500 }
      )
    }

    const resolvedParams = await Promise.resolve(params)
    const { componentId } = resolvedParams

    // Verify the inspection component belongs to the user's tenant
    const component = await prisma.inspectionComponent.findFirst({
      where: {
        id: componentId,
        inspectionRoom: {
          inspection: {
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
      },
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB (matches bucket limit)
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Generate unique filename with tenant prefix for organization
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "png"
    const filename = `${user.tenantId}/${componentId}-${timestamp}.${extension}`

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const bytes = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.INSPECTIONS)
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image to storage", details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.INSPECTIONS)
      .getPublicUrl(filename)

    const imageUrl = urlData.publicUrl

    // Update component with image URL
    await prisma.inspectionComponent.update({
      where: { id: componentId },
      data: { imageUrl },
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Failed to upload image", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

