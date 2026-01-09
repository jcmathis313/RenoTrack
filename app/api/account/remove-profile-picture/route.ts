import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, STORAGE_BUCKETS } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's profile picture URL
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePictureUrl: true },
    })

    if (currentUser?.profilePictureUrl) {
      try {
        // Extract filename from URL (format: .../profile-pictures/tenantId/userId-timestamp.ext)
        const urlParts = currentUser.profilePictureUrl.split("/")
        const filename = urlParts.slice(urlParts.indexOf("profile-pictures") + 1).join("/")
        
        if (filename && supabase) {
          // Delete from Supabase Storage
          await supabase.storage
            .from(STORAGE_BUCKETS.PROFILE_PICTURES)
            .remove([filename])
        }
      } catch (error) {
        // Log but don't fail if image deletion fails
        console.warn("Failed to delete profile picture from storage:", error)
      }
    }

    // Update user to remove profile picture URL
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        jobTitle: true,
        profilePictureUrl: true,
        role: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error removing profile picture:", error)
    return NextResponse.json(
      { error: "Failed to remove profile picture", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}






