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
    const { componentId, id: inspectionId } = resolvedParams

    // Verify the inspection component belongs to the user's tenant
    const component = await prisma.inspectionComponent.findFirst({
      where: {
        id: componentId,
        inspectionRoom: {
          inspection: {
            id: inspectionId,
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
      select: {
        id: true,
        inspectionRoomId: true,
      },
    })

    if (!component) {
      console.error("Component not found or access denied:", {
        componentId,
        inspectionId,
        tenantId: user.tenantId,
      })
      return NextResponse.json(
        { 
          error: "Component not found or access denied",
          componentId,
          inspectionId,
        }, 
        { status: 404 }
      )
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
    // Using service role key should bypass RLS, but if it doesn't, the SQL script will fix policies
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.INSPECTIONS)
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600', // Cache for 1 hour
      })

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", {
        message: uploadError.message,
        error: uploadError,
      })
      
      // Provide helpful error message for RLS issues
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
        return NextResponse.json(
          { 
            error: "Failed to upload image to storage",
            details: uploadError.message,
            suggestion: "Please run the SQL script in scripts/fix-supabase-storage-rls.sql to fix storage RLS policies",
            code: "RLS_POLICY_ERROR"
          },
          { status: 500 }
        )
      }
      
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
    // Verify component exists and belongs to user before updating
    try {
      // Double-check component exists using findUnique for better performance
      const existingComponent = await prisma.inspectionComponent.findUnique({
        where: { id: componentId },
        select: { id: true },
      })

      if (!existingComponent) {
        // File was uploaded but component doesn't exist - rollback
        console.error("Component not found for update after upload:", componentId)
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.INSPECTIONS)
          .remove([filename])
        
        if (deleteError) {
          console.error("Failed to delete uploaded file during rollback:", deleteError)
        }

        return NextResponse.json(
          { 
            error: "Component not found in database",
            componentId,
            uploadedImageUrl: imageUrl, // Include for manual recovery
          },
          { status: 404 }
        )
      }

      // Update the component
      const updatedComponent = await prisma.inspectionComponent.update({
        where: { id: componentId },
        data: { imageUrl },
        select: {
          id: true,
          imageUrl: true,
        },
      })

      console.log("Successfully updated component image:", {
        componentId: updatedComponent.id,
        imageUrl: updatedComponent.imageUrl,
      })

      return NextResponse.json({ 
        imageUrl: updatedComponent.imageUrl,
        componentId: updatedComponent.id 
      })
    } catch (dbError: any) {
      // If database update fails, try to delete the uploaded file from Supabase
      console.error("Database update failed after successful upload:", {
        componentId,
        error: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        stack: dbError?.stack,
      })
      console.error("Attempting to rollback: delete uploaded file from Supabase")
      
      try {
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.INSPECTIONS)
          .remove([filename])
        
        if (deleteError) {
          console.error("Failed to delete uploaded file during rollback:", deleteError)
        } else {
          console.log("Successfully rolled back uploaded file:", filename)
        }
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError)
      }

      // Return detailed error information
      return NextResponse.json(
        { 
          error: "Failed to update component in database",
          details: dbError?.message || "Unknown database error",
          code: dbError?.code,
          meta: dbError?.meta,
          componentId,
          // Include the imageUrl so it can be manually fixed if needed
          uploadedImageUrl: imageUrl,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Failed to upload image", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

