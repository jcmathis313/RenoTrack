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
    // Try to get all fields, but handle case where new fields might not exist yet
    let userData: any
    try {
      userData = await prisma.user.findUnique({
        where: { id: user.id },
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
    } catch (selectError: any) {
      // If select fails due to missing fields, try without the new fields
      if (selectError?.message?.includes('Unknown field') || selectError?.message?.includes('jobTitle') || selectError?.message?.includes('phone')) {
        console.warn("Some fields missing, fetching without new fields:", selectError.message)
        userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            profilePictureUrl: true,
            role: true,
          },
        })
        // Add default values for missing fields
        if (userData) {
          userData.phone = null
          userData.jobTitle = null
        }
      } else {
        throw selectError
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error: any) {
    console.error("Error fetching account data:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Check if it's a Prisma schema error (missing fields)
    if (error?.code === 'P2009' || error?.message?.includes('Unknown arg') || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: "Database schema error", 
          details: error?.message || "The database schema may be out of date. Please ensure phone, jobTitle, and profilePictureUrl columns exist in the User table.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch account data", details: error?.message || "Unknown error" },
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

    const { name, email, phone, jobTitle, password, profilePictureUrl } = body

    // Build update data
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name && name.trim() ? name.trim() : null
    }
    
    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null
    }
    
    if (jobTitle !== undefined) {
      updateData.jobTitle = jobTitle && jobTitle.trim() ? jobTitle.trim() : null
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
      let currentUser: any
      try {
        currentUser = await prisma.user.findUnique({
          where: { id: user.id },
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
      } catch (selectError: any) {
        // Fallback if new fields don't exist
        if (selectError?.message?.includes('Unknown field')) {
          currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              profilePictureUrl: true,
              role: true,
            },
          })
          if (currentUser) {
            currentUser.phone = null
            currentUser.jobTitle = null
          }
        } else {
          throw selectError
        }
      }
      return NextResponse.json(currentUser)
    }

    // Filter out fields that might not exist in database yet
    const safeUpdateData: any = {}
    const allowedFields = ['name', 'email', 'password', 'profilePictureUrl', 'phone', 'jobTitle']
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        safeUpdateData[key] = value
      }
    }

    // Update user - try with all fields first, fallback if needed
    let updated: any
    try {
      updated = await prisma.user.update({
        where: { id: user.id },
        data: safeUpdateData,
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
    } catch (updateError: any) {
      // If update fails due to missing fields, try without the new fields
      if (updateError?.message?.includes('Unknown argument') || updateError?.message?.includes('jobTitle') || updateError?.message?.includes('phone')) {
        // Remove new fields from update data and try again
        const fallbackUpdateData: any = {}
        if (safeUpdateData.name !== undefined) fallbackUpdateData.name = safeUpdateData.name
        if (safeUpdateData.email !== undefined) fallbackUpdateData.email = safeUpdateData.email
        if (safeUpdateData.password !== undefined) fallbackUpdateData.password = safeUpdateData.password
        if (safeUpdateData.profilePictureUrl !== undefined) fallbackUpdateData.profilePictureUrl = safeUpdateData.profilePictureUrl

        updated = await prisma.user.update({
          where: { id: user.id },
          data: fallbackUpdateData,
          select: {
            id: true,
            email: true,
            name: true,
            profilePictureUrl: true,
            role: true,
          },
        })
        // Add default values for fields that couldn't be updated
        updated.phone = safeUpdateData.phone !== undefined ? safeUpdateData.phone : null
        updated.jobTitle = safeUpdateData.jobTitle !== undefined ? safeUpdateData.jobTitle : null
      } else {
        throw updateError
      }
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating account:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Check if it's a Prisma schema error (missing fields)
    if (error?.code === 'P2009' || error?.message?.includes('Unknown arg') || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: "Database schema error", 
          details: error?.message || "The database schema may be out of date. Please ensure phone, jobTitle, and profilePictureUrl columns exist in the User table.",
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

