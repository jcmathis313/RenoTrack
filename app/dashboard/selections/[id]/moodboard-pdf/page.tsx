import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import MoodBoardPDFContent from "@/components/pdf/MoodBoardPDFContent"
import PDFChromeHider from "@/components/pdf/PDFChromeHider"

interface PageProps {
  params: {
    id: string
  }
}

async function getSelectionData(selectionId: string, tenantId: string) {
  const selection = await prisma.designProject.findFirst({
    where: {
      id: selectionId,
      unit: {
        building: {
          community: {
            tenantId: tenantId,
          },
        },
      },
    },
    include: {
      unit: {
        include: {
          building: {
            include: {
              community: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      },
      designRooms: {
        include: {
          designComponents: {
            where: {
              materialId: {
                not: null,
              },
            },
            select: {
              id: true,
              componentType: true,
              componentName: true,
              materialId: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  return selection
}

async function getTenantSettings(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })
  return settings
}

export default async function MoodBoardPDFPage({ params }: PageProps) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    // Ensure params is resolved (for Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params

    const selection = await getSelectionData(resolvedParams.id, user.tenantId)
    if (!selection) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Selection not found</h1>
          <p>The selection you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      )
    }

    // Fetch catalog items with images for mood board
    const materialIds = selection.designRooms
      .flatMap((room) => room.designComponents.map((comp) => comp.materialId))
      .filter((id): id is string => id !== null)

    const catalogItems = materialIds.length > 0
      ? await prisma.catalogItem.findMany({
          where: {
            id: { in: materialIds },
            tenantId: user.tenantId,
            imageUrl: {
              not: null,
            },
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            component: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : []

    const catalogMap = new Map(catalogItems.map((item) => [item.id, item]))

    // Organize catalog items by room
    const roomsWithItems = selection.designRooms
      .map((room) => {
        const roomItemIds = room.designComponents
          .map((comp) => comp.materialId)
          .filter((id): id is string => id !== null)

        const roomCatalogItems = roomItemIds
          .map((id) => catalogMap.get(id))
          .filter((item): item is typeof catalogItems[0] => item !== undefined)

        return {
          id: room.id,
          name: room.name,
          type: room.type,
          catalogItems: roomCatalogItems,
        }
      })
      .filter((room) => room.catalogItems.length > 0)

    const tenantSettings = await getTenantSettings(user.tenantId)

    const selectionData = {
      id: selection.id,
      name: selection.name,
      createdAt: selection.createdAt.toISOString(),
      unit: {
        id: selection.unit.id,
        number: selection.unit.number,
        building: {
          name: selection.unit.building.name,
          community: {
            id: selection.unit.building.community.id,
            name: selection.unit.building.community.name,
            logoUrl: selection.unit.building.community.logoUrl,
          },
        },
      },
      rooms: roomsWithItems,
    }

    return (
      <div className="pdf-container">
        <PDFChromeHider />
        <MoodBoardPDFContent
          selection={selectionData}
          tenantSettings={tenantSettings}
        />
      </div>
    )
  } catch (error: any) {
    console.error("Error generating mood board PDF:", error)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error</h1>
        <p>An error occurred while generating the mood board PDF.</p>
        <p style={{ color: "#ef4444", marginTop: "1rem" }}>
          {error?.message || "Unknown error"}
        </p>
      </div>
    )
  }
}



