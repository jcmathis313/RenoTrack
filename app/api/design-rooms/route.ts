import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { designProjectId, name, type } = body

    if (!designProjectId || !name) {
      return NextResponse.json(
        { error: "Design Project ID and name are required" },
        { status: 400 }
      )
    }

    // Verify design project belongs to user's tenant
    const designProject = await prisma.designProject.findFirst({
      where: {
        id: designProjectId,
        unit: {
          building: {
            community: {
              tenantId: user.tenantId,
            },
          },
        },
      },
    })

    if (!designProject) {
      return NextResponse.json(
        { error: "Design project not found or access denied" },
        { status: 404 }
      )
    }

    const designRoom = await prisma.designRoom.create({
      data: {
        designProjectId,
        name: name.trim(),
        type: type || null,
      },
    })

    return NextResponse.json(designRoom, { status: 201 })
  } catch (error: any) {
    console.error("Error creating design room:", error)
    return NextResponse.json(
      { error: "Failed to create design room" },
      { status: 500 }
    )
  }
}
