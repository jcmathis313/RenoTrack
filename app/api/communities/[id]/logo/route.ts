import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    
    console.log("Logo upload request for community:", id)
    
    const user = await getCurrentUser()
    if (!user) {
      console.error("Logo upload: Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify community belongs to user's tenant
    const community = await prisma.community.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!community) {
      console.error("Logo upload: Community not found", { id, tenantId: user.tenantId })
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      )
    }

    console.log("Logo upload: Parsing form data")
    const formData = await request.formData()
    const file = formData.get("file") as File
    console.log("Logo upload: File received", { 
      name: file?.name, 
      size: file?.size, 
      type: file?.type 
    })

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileExtension = file.name.split(".").pop() || "png"
    const fileName = `${id}-${Date.now()}.${fileExtension}`
    const uploadDir = join(process.cwd(), "public", "uploads", "communities")

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Save logo URL to database
    const logoUrl = `/uploads/communities/${fileName}`
    console.log("Logo upload: Saving to database", { logoUrl })
    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: { logoUrl },
    })

    console.log("Logo upload: Success", { logoUrl: updatedCommunity.logoUrl })
    return NextResponse.json({ logoUrl: updatedCommunity.logoUrl })
  } catch (error) {
    console.error("Error uploading logo:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to upload logo: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Export route config for Next.js 14+
export const runtime = "nodejs"
export const maxDuration = 30

