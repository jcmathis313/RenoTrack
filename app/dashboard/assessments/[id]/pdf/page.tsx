import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import AssessmentPDFContent from "@/components/pdf/AssessmentPDFContent"
import AssessmentPDFContentByVendor from "@/components/pdf/AssessmentPDFContentByVendor"
import PDFChromeHider from "@/components/pdf/PDFChromeHider"

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    variant?: string
  }
}

async function getAssessmentData(assessmentId: string, tenantId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
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
      rooms: {
        include: {
          componentAssessments: {
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
  return assessment
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

export default async function AssessmentPDFPage({ params, searchParams }: PageProps) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    // Ensure params is resolved (for Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
    const variant = resolvedSearchParams?.variant || "rooms" // Default to rooms

    const assessment = await getAssessmentData(resolvedParams.id, user.tenantId)
    if (!assessment) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Assessment not found</h1>
          <p>The assessment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      )
    }

    const assessmentForPdf = {
      ...assessment,
      assessedAt: assessment.assessedAt.toISOString(),
      unit: assessment.unit,
      rooms: assessment.rooms.map((room) => ({
        ...room,
        componentAssessments: room.componentAssessments,
      })),
    }

    const tenantSettings = await getTenantSettings(user.tenantId)
    const componentStatuses = await getComponentStatuses(user.tenantId)

    // If variant is "vendor", fetch related design components to get vendor information
    if (variant === "vendor") {
      // Find related design project (selection) for this assessment
      const designProject = await prisma.designProject.findFirst({
        where: {
          assessmentId: assessment.id,
          unit: {
            building: {
              community: {
                tenantId: user.tenantId,
              },
            },
          },
        },
        include: {
          designRooms: {
            include: {
              designComponents: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      // Create a map of component name/type to vendor for matching
      const componentVendorMap = new Map<string, { id: string; name: string } | null>()
      if (designProject) {
        designProject.designRooms.forEach((room) => {
          room.designComponents.forEach((comp) => {
            const key = comp.componentName || comp.componentType
            if (key && comp.vendor) {
              componentVendorMap.set(key, comp.vendor)
            }
          })
        })
      }

      return (
        <>
          <PDFChromeHider />
          <AssessmentPDFContentByVendor
            assessment={assessmentForPdf}
            tenantSettings={tenantSettings}
            componentStatuses={componentStatuses}
            componentVendorMap={Object.fromEntries(componentVendorMap)}
          />
        </>
      )
    }

    return (
      <>
        <PDFChromeHider />
        <AssessmentPDFContent
          assessment={assessmentForPdf}
          tenantSettings={tenantSettings}
          componentStatuses={componentStatuses}
        />
      </>
    )
  } catch (error: any) {
    console.error("Error rendering Assessment PDF page:", error)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error Loading PDF</h1>
        <p>{error?.message || "An error occurred while loading the PDF content."}</p>
      </div>
    )
  }
}

