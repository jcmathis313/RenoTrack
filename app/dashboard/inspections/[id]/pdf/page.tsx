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

    const inspection = await getInspectionData(params.id, user.tenantId)
    if (!inspection) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Inspection not found</h1>
          <p>The inspection you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      )
    }

    const inspectionForPdf = {
      ...inspection,
      inspectedAt: inspection.inspectedAt.toISOString(),
      designProject: inspection.designProject,
      inspectionRooms: inspection.inspectionRooms.map((room) => ({
        ...room,
        inspectionComponents: room.inspectionComponents,
      })),
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
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error Loading PDF</h1>
        <p>{error?.message || "An error occurred while loading the PDF content."}</p>
      </div>
    )
  }
}

