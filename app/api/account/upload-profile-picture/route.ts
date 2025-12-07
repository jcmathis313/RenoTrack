import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, STORAGE_BUCKETS } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabase) {
      console.error("Supabase client not initialized. Check environment variables.")
      return NextResponse.json(
        { error: "File storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables." },
        { status: 500 }
      )
    }

    let formData
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error("Error parsing form data:", parseError)
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      )
    }

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

    // Validate file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Delete old profile picture if it exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePictureUrl: true },
    })

    if (currentUser?.profilePictureUrl) {
      try {
        // Extract filename from URL (format: .../profile-pictures/tenantId/userId-timestamp.ext)
        const urlParts = currentUser.profilePictureUrl.split("/")
        const filename = urlParts.slice(urlParts.indexOf("profile-pictures") + 1).join("/")
        
        if (filename) {
          await supabase.storage
            .from(STORAGE_BUCKETS.PROFILE_PICTURES)
            .remove([filename])
        }
      } catch (error) {
        // Log but don't fail if old image deletion fails
        console.warn("Failed to delete old profile picture:", error)
      }
    }

    // Generate unique filename with tenant and user prefix
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "png"
    const filename = `${user.tenantId}/${user.id}-${timestamp}.${extension}`

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const bytes = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PICTURES)
      .upload(filename, fileBuffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError)
      console.error("Upload error details:", {
        message: uploadError.message,
        error: uploadError,
      })
      const errorMessage = uploadError.message || "Unknown upload error"
      const isBucketError = errorMessage.toLowerCase().includes("bucket") || errorMessage.toLowerCase().includes("not found")
      return NextResponse.json(
        { 
          error: "Failed to upload image to storage", 
          details: errorMessage,
          hint: isBucketError ? "The bucket may not exist or you may not have permission. Please create the 'profile-pictures' bucket in Supabase Storage." : undefined
        },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PICTURES)
      .getPublicUrl(filename)

    const imageUrl = urlData.publicUrl

    // Update user with image URL
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: imageUrl },
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("Error uploading profile picture:", error)
    return NextResponse.json(
      { error: "Failed to upload profile picture", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

