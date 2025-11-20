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
  condition: string | null
  materialId: string | null
  catalogItem: CatalogItem | null
  quantity: number
  unitCost: number
  totalCost: number
  residentUpgrade: boolean | null
  notes: string | null
}

interface InspectionComponent {
  id: string
  componentType: string
  componentName: string | null
  status: string | null // "pass" | "fail" | null
  notes: string | null
  imageUrl: string | null
  designComponent: DesignComponent | null
}

interface InspectionRoom {
  id: string
  name: string
  type: string | null
  status: string | null
  order: number
  inspectionComponents: InspectionComponent[]
}

interface Inspection {
  id: string
  inspectedBy: string | null
  inspectedAt: string
  status: string | null
  designProject: {
    id: string
    name: string
    unit: {
      id: string
      number: string
      building: {
        name: string
        community: {
          id: string
          name: string
          logoUrl: string | null
        }
      }
    }
  }
  inspectionRooms: InspectionRoom[]
}

interface InspectionPDFContentProps {
  inspection: Inspection
  tenantSettings: TenantSettings | null
  componentStatuses: ComponentStatus[]
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

const getInspectionStatusColor = (status: string | null): string => {
  if (status === "pass") return "#10b981"
  if (status === "fail") return "#ef4444"
  return "#6b7280"
}

export default function InspectionPDFContent({
  inspection,
  tenantSettings,
  componentStatuses,
}: InspectionPDFContentProps) {
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div
      className="pdf-container pdf-portrait"
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
              Inspection Report
            </div>
            <div className="pdf-title">
              {inspection.designProject?.unit?.building?.community?.name || "—"} - {inspection.designProject?.unit?.building?.name || "—"} - Unit {inspection.designProject?.unit?.number || "—"}
            </div>
            <div className="pdf-subtitle">Generated {generatedAt}</div>
          </div>
          {inspection.designProject?.unit?.building?.community?.logoUrl && (
            <div className="pdf-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspection.designProject.unit.building.community.logoUrl}
                alt={`${inspection.designProject.unit.building.community.name || "Community"} logo`}
                className="pdf-logo-image"
              />
            </div>
          )}
        </div>

        <div className="pdf-meta-grid">
          <div>
            <div className="pdf-meta-label">Community</div>
            <div className="pdf-meta-value">{inspection.designProject?.unit?.building?.community?.name || "—"}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Building</div>
            <div className="pdf-meta-value">{inspection.designProject?.unit?.building?.name || "—"}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Unit</div>
            <div className="pdf-meta-value">{inspection.designProject?.unit?.number || "—"}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Inspection Date</div>
            <div className="pdf-meta-value">{formatDate(inspection.inspectedAt)}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Inspected By</div>
            <div className="pdf-meta-value">{inspection.inspectedBy || "—"}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Status</div>
            <div className="pdf-meta-value">{inspection.status || "—"}</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="pdf-section">
        <div className="pdf-info-card">
          <div className="pdf-info-column">
            <div className="pdf-info-heading">Executive Summary</div>
            <div className="pdf-stats-grid">
              <div className="pdf-stat-card">
                <div className="pdf-stat-label">Rooms</div>
                <div className="pdf-stat-value">{inspection.inspectionRooms.length}</div>
                <div className="pdf-stat-subtext">Included in this report</div>
              </div>
              <div className="pdf-stat-card">
                <div className="pdf-stat-label">Items Inspected</div>
                <div className="pdf-stat-value">
                  {inspection.inspectionRooms.reduce(
                    (sum, room) => sum + room.inspectionComponents.length,
                    0
                  )}
                </div>
                <div className="pdf-stat-subtext">Across all rooms</div>
              </div>
              <div className="pdf-stat-card">
                <div className="pdf-stat-label">Passed</div>
                <div className="pdf-stat-value text-green-600">
                  {inspection.inspectionRooms.reduce(
                    (sum, room) =>
                      sum + room.inspectionComponents.filter((c) => c.status === "pass").length,
                    0
                  )}
                </div>
                <div className="pdf-stat-subtext">Items passed inspection</div>
              </div>
              <div className="pdf-stat-card">
                <div className="pdf-stat-label">Failed</div>
                <div className="pdf-stat-value text-red-600">
                  {inspection.inspectionRooms.reduce(
                    (sum, room) =>
                      sum + room.inspectionComponents.filter((c) => c.status === "fail").length,
                    0
                  )}
                </div>
                <div className="pdf-stat-subtext">Items failed inspection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms and Components - separate table for each room */}
      {inspection.inspectionRooms && inspection.inspectionRooms.length > 0 ? (
        inspection.inspectionRooms.map((room) => (
        <div key={room.id} className="pdf-section">
          <div className="pdf-group-table-wrapper">
            {/* Room Header */}
            <div
              className="pdf-group-header"
              style={{
                backgroundColor: "#111827",
                background: "#111827",
                color: "white",
                display: "block",
              }}
            >
              {room.name.toUpperCase()}
            </div>
            {/* Separate table for this room */}
            {room.inspectionComponents.length > 0 ? (
              <table className="component-table spec-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Work Description</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {room.inspectionComponents.map((component) => (
                    <tr key={component.id}>
                      <td>
                        <div className="component-type-title">
                          {component.componentName || component.componentType}
                        </div>
                        {component.designComponent?.condition && (
                          <span
                            className="status-pill"
                            style={{
                              backgroundColor: getStatusColor(
                                component.designComponent.condition,
                                componentStatuses
                              ),
                              color: "white",
                              background: getStatusColor(
                                component.designComponent.condition,
                                componentStatuses
                              ),
                            } as React.CSSProperties}
                          >
                            {component.designComponent.condition}
                          </span>
                        )}
                      </td>
                      <td>
                        {component.designComponent?.catalogItem ? (
                          <div className="component-material">
                            <div className="component-material-title">
                              {component.designComponent.catalogItem.manufacturer ||
                                component.designComponent.catalogItem.description ||
                                "Catalog Item"}
                            </div>
                            {(() => {
                              const materialMeta = [
                                component.designComponent.catalogItem?.modelNumber,
                                component.designComponent.catalogItem?.finish,
                                component.designComponent.catalogItem?.color,
                              ]
                                .filter(Boolean)
                                .join(" • ")
                              if (!materialMeta) return null
                              return (
                                <div className="component-material-meta">{materialMeta}</div>
                              )
                            })()}
                            {component.designComponent.catalogItem.description && (
                              <div className="component-description">
                                {component.designComponent.catalogItem.description}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {component.imageUrl ? (
                          <div className="component-image-wrap">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={component.imageUrl}
                              alt={component.componentName || "Inspection image"}
                              className="component-image"
                            />
                          </div>
                        ) : component.designComponent?.catalogItem?.imageUrl ? (
                          <div className="component-image-wrap">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={component.designComponent.catalogItem.imageUrl}
                              alt={component.componentName || "Catalog item image"}
                              className="component-image"
                            />
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {component.status ? (
                          <span
                            className="status-pill"
                            style={{
                              backgroundColor: getInspectionStatusColor(component.status),
                              color: "white",
                              background: getInspectionStatusColor(component.status),
                            } as React.CSSProperties}
                          >
                            {component.status === "pass" ? "Pass" : "Fail"}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="component-notes-text">{component.notes || "—"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-muted">No items inspected in this room.</div>
            )}
          </div>
        </div>
        ))
      ) : (
        <div className="pdf-section">
          <div className="text-muted">No rooms found in this inspection.</div>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div>{companyName}</div>
        <div>Generated on {generatedAt}</div>
      </div>
    </div>
  )
}


