import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import SelectionPDFContent from "@/components/pdf/SelectionPDFContent"

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
                },
              },
            },
          },
        },
      },
      assessment: {
        select: {
          id: true,
          assessedAt: true,
          assessedBy: true,
        },
      },
      designRooms: {
        include: {
          designComponents: {
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

async function getComponentStatuses(tenantId: string) {
  const statuses = await prisma.componentStatus.findMany({
    where: { tenantId },
    orderBy: { order: "asc" },
  })
  return statuses
}

export default async function SelectionPDFPage({ params }: PageProps) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const selection = await getSelectionData(params.id, user.tenantId)
    if (!selection) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Selection not found</h1>
          <p>The selection you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      )
    }

  // Fetch catalog items for material references
  const materialIds = selection.designRooms
    .flatMap((room) => room.designComponents)
    .map((comp) => comp.materialId)
    .filter((id): id is string => id !== null)

  const catalogItems = materialIds.length > 0
    ? await prisma.catalogItem.findMany({
        where: {
          id: { in: materialIds },
          tenantId: user.tenantId,
        },
        select: {
          id: true,
          description: true,
          modelNumber: true,
          manufacturer: true,
          finish: true,
          color: true,
        },
      })
    : []

  const catalogMap = new Map(catalogItems.map((item) => [item.id, item]))

  // Attach catalog items to components
  const selectionWithMaterials = {
    ...selection,
    createdAt: selection.createdAt.toISOString(),
    assessment: selection.assessment ? {
      ...selection.assessment,
      assessedAt: selection.assessment.assessedAt.toISOString(),
    } : null,
    designRooms: selection.designRooms.map((room) => ({
      ...room,
      designComponents: room.designComponents.map((comp) => ({
        ...comp,
        material: comp.materialId ? catalogMap.get(comp.materialId) || null : null,
      })),
    })),
  }

  const tenantSettings = await getTenantSettings(user.tenantId)
  const componentStatuses = await getComponentStatuses(user.tenantId)

    return (
      <SelectionPDFContent
        selection={selectionWithMaterials}
        tenantSettings={tenantSettings}
        componentStatuses={componentStatuses}
      />
    )
  } catch (error: any) {
    console.error("Error rendering PDF page:", error)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error Loading PDF</h1>
        <p>{error?.message || "An error occurred while loading the PDF content."}</p>
      </div>
    )
  }
}
