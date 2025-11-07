import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> | { id: string; componentId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id, componentId } = resolvedParams
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    // Validate status
    if (status && !["pass", "fail", null].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'pass', 'fail', or null" },
        { status: 400 }
      )
    }

    // Verify component belongs to inspection in user's tenant
    const component = await prisma.inspectionComponent.findFirst({
      where: {
        id: componentId,
        inspectionRoom: {
          inspectionId: id,
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
      return NextResponse.json(
        { error: "Component not found or access denied" },
        { status: 404 }
      )
    }

    // Update component
    const updated = await prisma.inspectionComponent.update({
      where: { id: componentId },
      data: {
        status: status === null ? null : status,
        notes: notes !== undefined ? notes : component.notes,
      },
    })

    // Update room status based on component completion
    const room = await prisma.inspectionRoom.findFirst({
      where: {
        id: component.inspectionRoomId,
      },
      include: {
        inspectionComponents: true,
      },
    })

    if (room) {
      const allComponents = room.inspectionComponents
      const completedCount = allComponents.filter((c) => c.status !== null).length
      const totalCount = allComponents.length

      let roomStatus = "pending"
      if (completedCount === totalCount && totalCount > 0) {
        roomStatus = "complete"
      } else if (completedCount > 0) {
        roomStatus = "in progress"
      }

      await prisma.inspectionRoom.update({
        where: { id: room.id },
        data: { status: roomStatus },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating component:", error)
    return NextResponse.json(
      { error: "Failed to update component" },
      { status: 500 }
    )
  }
}

