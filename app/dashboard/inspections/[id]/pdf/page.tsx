import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import InspectionPDFContent from "@/components/pdf/InspectionPDFContent"
import PDFChromeHider from "@/components/pdf/PDFChromeHider"

interface PageProps {
  params: {
    id: string
  }
}

async function getInspectionData(inspectionId: string, tenantId: string) {
  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      designProject: {
        unit: {
          building: {
            community: {
              tenantId: tenantId,
            },
          },
        },
      },
    },
    include: {
      designProject: {
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
      },
      inspectionRooms: {
        include: {
          inspectionComponents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  })
  return inspection
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

export default async function InspectionPDFPage({ params }: PageProps) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    // Ensure params is resolved (for Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const inspectionId = resolvedParams.id

    if (!inspectionId) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Invalid Inspection ID</h1>
          <p>The inspection ID is missing or invalid.</p>
        </div>
      )
    }

    const inspection = await getInspectionData(inspectionId, user.tenantId)
    if (!inspection) {
      console.error("InspectionPDFPage: Inspection not found", { inspectionId, tenantId: user.tenantId })
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Inspection not found</h1>
          <p>The inspection you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      )
    }

    if (!inspection.designProject) {
      console.error("InspectionPDFPage: Design project not found for inspection", { inspectionId })
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Design Project Missing</h1>
          <p>This inspection is missing its associated design project.</p>
        </div>
      )
    }

    // Match inspection components with design components to get catalog items
    const materialIds = inspection.designProject?.designRooms
      ?.flatMap((room) => room.designComponents || [])
      ?.map((comp) => comp.materialId)
      ?.filter((id): id is string => id !== null) || []

    const catalogItems = materialIds.length > 0
      ? await prisma.catalogItem.findMany({
          where: {
            id: { in: materialIds },
            tenantId: user.tenantId,
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

    // Enrich inspection components with catalog item details
    // Serialize all data to ensure it's JSON-serializable for client component
    const inspectionForPdf = {
      id: inspection.id,
      inspectedBy: inspection.inspectedBy,
      inspectedAt: inspection.inspectedAt.toISOString(),
      status: inspection.status,
      designProject: {
        id: inspection.designProject.id,
        name: inspection.designProject.name,
        unit: {
          id: inspection.designProject.unit.id,
          number: inspection.designProject.unit.number,
          building: {
            name: inspection.designProject.unit.building.name,
            community: {
              id: inspection.designProject.unit.building.community.id,
              name: inspection.designProject.unit.building.community.name,
              logoUrl: inspection.designProject.unit.building.community.logoUrl,
            },
          },
        },
      },
      inspectionRooms: inspection.inspectionRooms.map((inspectionRoom) => {
        const designRoom = inspection.designProject?.designRooms?.find(
          (dr) => dr.name === inspectionRoom.name
        )

        return {
          id: inspectionRoom.id,
          name: inspectionRoom.name,
          type: inspectionRoom.type,
          status: inspectionRoom.status,
          order: inspectionRoom.order,
          inspectionComponents: inspectionRoom.inspectionComponents.map((inspectionComponent) => {
            const designComponent = designRoom?.designComponents?.find(
              (dc) =>
                dc.componentType === inspectionComponent.componentType &&
                (dc.componentName === inspectionComponent.componentName ||
                  (!dc.componentName && !inspectionComponent.componentName))
            )

            const catalogItem = designComponent?.materialId
              ? catalogItems.find((item) => item.id === designComponent.materialId) || null
              : null

            // Convert relative image URLs to absolute URLs for PDF rendering
            let imageUrl = inspectionComponent.imageUrl
            if (imageUrl && imageUrl.startsWith("/uploads")) {
              // Convert relative path to absolute URL
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
              imageUrl = `${baseUrl}${imageUrl}`
            }

            return {
              id: inspectionComponent.id,
              componentType: inspectionComponent.componentType,
              componentName: inspectionComponent.componentName,
              status: inspectionComponent.status,
              notes: inspectionComponent.notes,
              imageUrl: imageUrl,
              designComponent: designComponent
                ? {
                    condition: designComponent.condition || null,
                    materialId: designComponent.materialId || null,
                    catalogItem: catalogItem
                      ? {
                          id: catalogItem.id,
                          description: catalogItem.description,
                          modelNumber: catalogItem.modelNumber,
                          manufacturer: catalogItem.manufacturer,
                          finish: catalogItem.finish,
                          color: catalogItem.color,
                          imageUrl: catalogItem.imageUrl,
                          category: catalogItem.category || null,
                          component: catalogItem.component || null,
                        }
                      : null,
                    quantity: designComponent.quantity || 0,
                    unitCost: designComponent.unitCost || 0,
                    totalCost: designComponent.totalCost || 0,
                    residentUpgrade: designComponent.residentUpgrade || null,
                    notes: designComponent.notes || null,
                  }
                : null,
            }
          }),
        }
      }),
    }

    const tenantSettings = await getTenantSettings(user.tenantId)
    const componentStatuses = await getComponentStatuses(user.tenantId)

    return (
      <>
        <PDFChromeHider />
        <InspectionPDFContent
          inspection={inspectionForPdf}
          tenantSettings={tenantSettings}
          componentStatuses={componentStatuses}
        />
      </>
    )
  } catch (error: any) {
    console.error("Error rendering Inspection PDF page:", error)
    console.error("Error stack:", error?.stack)
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    })
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error Loading PDF</h1>
        <p>{error?.message || "An error occurred while loading the PDF content."}</p>
        {process.env.NODE_ENV === "development" && error?.stack && (
          <pre style={{ marginTop: "1rem", textAlign: "left", fontSize: "0.75rem" }}>
            {error.stack}
          </pre>
        )}
      </div>
    )
  }
}

