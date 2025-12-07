import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user data (excluding password)
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePictureUrl: true,
        role: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error: any) {
    console.error("Error fetching account data:", error)
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { name, phone, email, password, profilePictureUrl } = body

    // Build update data
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name && name.trim() ? name.trim() : null
    }
    
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null
    }
    
    if (email !== undefined) {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        )
      }

      // Check if email is already taken by another user in the same tenant
      const existingUser = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          tenantId: user.tenantId,
          id: { not: user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
      
      updateData.email = trimmedEmail
    }
    
    if (password !== undefined && password && password.trim()) {
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl && profilePictureUrl.trim() ? profilePictureUrl.trim() : null
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      // Return current user data if nothing to update
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          profilePictureUrl: true,
          role: true,
        },
      })
      return NextResponse.json(currentUser)
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePictureUrl: true,
        role: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating account:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Check if it's a Prisma schema error (missing fields)
    if (error?.code === 'P2009' || error?.message?.includes('Unknown arg')) {
      return NextResponse.json(
        { 
          error: "Database schema error", 
          details: "The database schema may be out of date. Please run: npx prisma db push",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update account", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}

