import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import SelectionPDFContent from "@/components/pdf/SelectionPDFContent"
import PDFChromeHider from "@/components/pdf/PDFChromeHider"

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    variant?: string
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
            // No filtering - get ALL components
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        // Order rooms consistently
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

export default async function SelectionPDFPage({ params, searchParams }: PageProps) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    // Ensure params is resolved (for Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
    const variant = resolvedSearchParams?.variant || "categories" // Default to categories

    const selection = await getSelectionData(resolvedParams.id, user.tenantId)
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
          imageUrl: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    : []

  const catalogMap = new Map(catalogItems.map((item) => [item.id, item]))

  // Fetch vendors for vendor references
  const vendorIds = selection.designRooms
    .flatMap((room) => room.designComponents)
    .map((comp) => comp.vendorId)
    .filter((id): id is string => id !== null)

  const vendors = vendorIds.length > 0
    ? await prisma.vendor.findMany({
        where: {
          id: { in: vendorIds },
          tenantId: user.tenantId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : []

  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]))

  // Attach catalog items to components
  const selectionWithMaterials = {
    ...selection,
    createdAt: selection.createdAt.toISOString(),
    assessment: selection.assessment ? {
      ...selection.assessment,
      assessedAt: selection.assessment.assessedAt.toISOString(),
    } : null,
    designRooms: selection.designRooms.map((room) => {
      // Ensure we preserve ALL components - use full array, no filtering
      const allComponents = Array.isArray(room.designComponents) ? room.designComponents : []
      
      // Map each component explicitly to preserve all data
      const mappedComponents = allComponents.map((comp) => ({
        id: comp.id,
        componentType: comp.componentType,
        componentName: comp.componentName,
        condition: comp.condition,
        materialId: comp.materialId,
        vendorId: comp.vendorId,
        quantity: comp.quantity,
        unitCost: comp.unitCost,
        totalCost: comp.totalCost,
        residentUpgrade: comp.residentUpgrade,
        notes: comp.notes,
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
        material: comp.materialId ? catalogMap.get(comp.materialId) || null : null,
        vendor: comp.vendorId ? vendorMap.get(comp.vendorId) || null : null,
      }))
      
      // Verify no components were lost
      if (mappedComponents.length !== allComponents.length) {
        console.error(`Room: ${room.name} - Lost components during mapping. Original: ${allComponents.length}, Mapped: ${mappedComponents.length}`)
      }
      
      console.log(`Room "${room.name}": ${allComponents.length} components`)
      
      return {
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
        designComponents: mappedComponents,
      }
    }),
  }

  const tenantSettings = await getTenantSettings(user.tenantId)
  const componentStatuses = await getComponentStatuses(user.tenantId)

    return (
      <>
        <PDFChromeHider />
        <SelectionPDFContent
          selection={selectionWithMaterials}
          tenantSettings={tenantSettings}
          componentStatuses={componentStatuses}
          variant={variant as "rooms" | "categories"}
        />
      </>
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
