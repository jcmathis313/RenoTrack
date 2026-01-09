"use client"

import React from "react"

interface ComponentStatus {
  id: string
  name: string
  color?: string
}

interface TenantSettings {
  id?: string
  companyName?: string | null
  businessAddress?: string | null
  themeColor?: string | null
}

interface CatalogItem {
  id: string
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
  imageUrl: string | null
  category?: {
    id: string
    name: string
  } | null
}

interface DesignComponent {
  id: string
  componentType: string
  componentName: string | null
  condition: string | null
  materialId: string | null
  vendorId: string | null
  quantity: number
  unitCost: number
  totalCost: number
  notes: string | null
  residentUpgrade?: boolean | null
  material?: CatalogItem | null
  vendor?: {
    id: string
    name: string
  } | null
}

interface DesignRoom {
  id: string
  name: string
  type: string | null
  designComponents: DesignComponent[]
}

interface Selection {
  id: string
  name: string
  status: string | null
  createdAt: string
  unit: {
    id: string
    number: string
    building: {
      name: string
      community: {
        id: string
        name: string
        logoUrl?: string | null
      }
    }
  }
  assessment: {
    id: string
    assessedAt: string
    assessedBy: string | null
  } | null
  designRooms: DesignRoom[]
}

interface SelectionPDFContentProps {
  selection: Selection
  tenantSettings: TenantSettings | null
  componentStatuses: ComponentStatus[]
  variant?: "rooms" | "categories" | "vendor"
}

const getStatusColor = (statusName: string | null, statuses: ComponentStatus[]): string => {
  if (!statusName) return "#6b7280"
  const status = statuses.find((s) => s.name === statusName)
  if (!status) return "#6b7280"

  const colorMap: Record<string, string> = {
    green: "#10b981",
    blue: "#3b82f6",
    orange: "#f97316",
    red: "#ef4444",
    gray: "#6b7280",
    yellow: "#eab308",
  }

  return colorMap[status.color || "gray"] || "#6b7280"
}

const getConditionColor = (condition: string | null): string => {
  if (!condition) return "#6b7280"
  const upper = condition.toUpperCase()
  if (upper === "REPLACE") return "#f97316" // Orange
  if (upper === "KEEP") return "#10b981" // Green
  return "#6b7280" // Gray
}

export default function SelectionPDFContent({
  selection,
  tenantSettings,
  componentStatuses,
  variant = "categories",
}: SelectionPDFContentProps) {
  const companyName = tenantSettings?.companyName || "Your Company"
  const businessAddress = tenantSettings?.businessAddress || ""
  const accentColor = "#111827" // Black for monochrome theme

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const allComponents = selection.designRooms.flatMap((room) => {
    const roomComps = Array.isArray(room.designComponents) ? room.designComponents : []
    // Explicitly map all fields to avoid data loss
    return roomComps.map((comp) => ({
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
      material: comp.material || null,
      vendor: comp.vendor || null,
      roomName: room.name,
    }))
  })

  const totalCost = allComponents.reduce((sum, comp) => sum + (comp.totalCost || 0), 0)

  // Group by category, room, or vendor based on variant
  let groupedData: Record<string, (DesignComponent & { roomName: string })[]>
  let sortedGroups: string[]

  if (variant === "rooms") {
    // Group by room - include ALL rooms, even if they have no components
    groupedData = selection.designRooms.reduce<
      Record<string, (DesignComponent & { roomName: string })[]>
    >((groups, room) => {
      // Always create an entry for each room, even if empty
      // Map all components explicitly to ensure nothing is lost
      // IMPORTANT: Use the full array, don't filter anything
      const roomComponents = Array.isArray(room.designComponents) ? room.designComponents : []
      
      // Map ALL components explicitly - do not filter or skip any
      const mappedComponents = roomComponents.map((comp) => ({
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
        material: comp.material || null,
        vendor: comp.vendor || null,
        roomName: room.name,
      }))
      
      // Verify we didn't lose any components during mapping
      if (mappedComponents.length !== roomComponents.length) {
        console.error(`ERROR: Lost components during mapping! Room: ${room.name}, Original: ${roomComponents.length}, Mapped: ${mappedComponents.length}`)
      }
      
      groups[room.name] = mappedComponents
      return groups
    }, {})
    sortedGroups = selection.designRooms.map((room) => room.name)
  } else if (variant === "vendor") {
    // Group by vendor
    groupedData = allComponents.reduce<
      Record<string, (DesignComponent & { roomName: string })[]>
    >((groups, component) => {
      const vendorName = component.vendor?.name || "No Vendor Assigned"
      if (!groups[vendorName]) {
        groups[vendorName] = []
      }
      groups[vendorName].push(component)
      return groups
    }, {})
    // Sort vendors alphabetically, with "No Vendor Assigned" at the end
    sortedGroups = Object.keys(groupedData).sort((a, b) => {
      if (a === "No Vendor Assigned") return 1
      if (b === "No Vendor Assigned") return -1
      return a.localeCompare(b)
    })
  } else {
    // Group by category
    groupedData = allComponents.reduce<
      Record<string, (DesignComponent & { roomName: string })[]>
    >((groups, component) => {
      const categoryName =
        component.material?.category?.name || component.componentType || "Other"
      if (!groups[categoryName]) {
        groups[categoryName] = []
      }
      groups[categoryName].push(component)
      return groups
    }, {})
    sortedGroups = Object.keys(groupedData).sort()
  }

  return (
    <div
      className="pdf-container"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#1f2937",
        lineHeight: 1.35,
        fontSize: "8pt",
      }}
    >
      {/* PDF Header */}
      <div className="pdf-header">
        <div className="pdf-header-main">
          <div>
            <div className="pdf-eyebrow" style={{ color: accentColor }}>
              Selection Report
            </div>
            <div className="pdf-title">
              {selection.unit.building.community.name} - {selection.unit.building.name} - Unit {selection.unit.number}
            </div>
            <div className="pdf-subtitle">Generated {generatedAt}</div>
          </div>
          {selection.unit.building.community.logoUrl && (
            <div className="pdf-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selection.unit.building.community.logoUrl}
                alt={`${selection.unit.building.community.name} logo`}
                className="pdf-logo-image"
              />
            </div>
          )}
        </div>

        <div className="pdf-meta-grid">
          <div>
            <div className="pdf-meta-label">Community</div>
            <div className="pdf-meta-value">{selection.unit.building.community.name}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Building</div>
            <div className="pdf-meta-value">{selection.unit.building.name}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Unit</div>
            <div className="pdf-meta-value">{selection.unit.number}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Selection Date</div>
            <div className="pdf-meta-value">
              {new Date(selection.createdAt).toLocaleDateString()}
            </div>
          </div>
          {selection.assessment && (
            <>
              <div>
                <div className="pdf-meta-label">Assessment Date</div>
                <div className="pdf-meta-value">
                  {new Date(selection.assessment.assessedAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="pdf-meta-label">Assessed By</div>
                <div className="pdf-meta-value">{selection.assessment.assessedBy || "—"}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Components grouped by category or room - separate table for each group */}
      <div className="pdf-section">
        {sortedGroups.map((groupName) => {
          const components = Array.isArray(groupedData[groupName]) ? groupedData[groupName] : []
          
          // Log component count per room
          console.log(`[PDF] Room "${groupName}": ${components.length} components`, components.map(c => c.componentName || c.componentType))
          
          return (
          <div key={groupName} className="pdf-group-table-wrapper">
            {/* Component count above room header */}
            <div style={{ 
              fontSize: '8pt', 
              color: '#666', 
              padding: '2px 0 4px 0',
              textAlign: 'left'
            }}>
              {components.length} component{components.length !== 1 ? 's' : ''}
            </div>
            {/* Group Header (Category or Room) */}
            <div 
              className="pdf-group-header"
              style={{
                backgroundColor: "#111827",
                background: "#111827",
                color: "white",
                display: "block",
              }}
            >
              {groupName.toUpperCase()}
            </div>
            {/* Separate table for this group */}
            {components.length > 0 ? (
            <table className={`component-table spec-table ${variant === "vendor" ? "vendor-variant" : ""}`}>
              <thead>
                <tr>
                  {variant === "vendor" && <th>Room</th>}
                  <th>Component</th>
                  <th>Work Description</th>
                  <th>Image</th>
                  <th>Upgrade</th>
                  <th className="quantity-cell">QTY</th>
                  <th>Notes</th>
                  {variant !== "vendor" && <th>Vendor</th>}
                </tr>
              </thead>
              <tbody>
                {components.map((component, index) => (
                  <tr key={`${groupName}-${component.id}-${index}`}>
                    {variant === "vendor" && (
                      <td>
                        <div className="component-type-title">
                          {component.roomName}
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="component-type-title">
                        {component.componentName || component.componentType}
                      </div>
                      {component.condition && (
                        <span
                          className="status-pill"
                          style={{
                            backgroundColor: getStatusColor(component.condition, componentStatuses),
                            color: "white",
                            background: getStatusColor(component.condition, componentStatuses),
                          } as React.CSSProperties}
                        >
                          {component.condition}
                        </span>
                      )}
                    </td>
                    <td>
                      {component.material ? (
                        <div className="component-material">
                          <div className="component-material-title">
                            {component.material.manufacturer ||
                              component.material.description ||
                              "Catalog Item"}
                          </div>
                          {(() => {
                            const materialMeta = [
                              component.material.modelNumber,
                              component.material.finish,
                              component.material.color,
                            ]
                              .filter(Boolean)
                              .join(" • ")
                            if (!materialMeta) return null
                            return (
                              <div className="component-material-meta">{materialMeta}</div>
                            )
                          })()}
                          {component.material.description && (
                            <div className="component-description">
                              {component.material.description}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {component.material?.imageUrl ? (
                        <div className="component-image-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={component.material.imageUrl}
                            alt={component.componentName || "Catalog item image"}
                            className="component-image"
                          />
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {component.residentUpgrade ? (
                        <span className="upgrade-badge">Upgrade</span>
                      ) : (
                        <span className="text-muted">Included</span>
                      )}
                    </td>
                    <td className="quantity-cell">{component.quantity || "—"}</td>
                    <td>
                      <div className="component-notes-text">
                        {component.notes || <span className="text-muted">—</span>}
                      </div>
                    </td>
                    {variant !== "vendor" && (
                      <td>
                        <div className="text-xs">
                          {component.vendor?.name || <span className="text-muted">—</span>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
              <div style={{ 
                padding: "1rem", 
                textAlign: "center", 
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "10pt"
              }}>
                MISSING ROOM INFORMATION
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div>{companyName}</div>
        <div>Generated on {generatedAt}</div>
      </div>
    </div>
  )
}
