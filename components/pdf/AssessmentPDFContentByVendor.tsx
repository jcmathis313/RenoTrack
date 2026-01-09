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

interface ComponentAssessment {
  id: string
  componentType: string
  componentName: string | null
  condition: string
  notes: string | null
}

interface Room {
  id: string
  name: string
  type: string | null
  order: number
  componentAssessments: ComponentAssessment[]
}

interface Assessment {
  id: string
  assessedBy: string | null
  assessedAt: string
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
  rooms: Room[]
}

interface AssessmentPDFContentByVendorProps {
  assessment: Assessment
  tenantSettings: TenantSettings | null
  componentStatuses: ComponentStatus[]
  componentVendorMap: Record<string, { id: string; name: string } | null>
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

export default function AssessmentPDFContentByVendor({
  assessment,
  tenantSettings,
  componentStatuses,
  componentVendorMap,
}: AssessmentPDFContentByVendorProps) {
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

  // Flatten all components from all rooms and add vendor and room info
  const allComponents = assessment.rooms.flatMap((room) => {
    return room.componentAssessments.map((component) => {
      const componentKey = component.componentName || component.componentType
      const vendor = componentKey ? componentVendorMap[componentKey] || null : null
      return {
        ...component,
        roomName: room.name,
        vendor: vendor,
      }
    })
  })

  // Group components by vendor
  const groupedByVendor = allComponents.reduce<
    Record<string, (ComponentAssessment & { roomName: string; vendor: { id: string; name: string } | null })[]>
  >((groups, component) => {
    const vendorName = component.vendor?.name || "No Vendor Assigned"
    if (!groups[vendorName]) {
      groups[vendorName] = []
    }
    groups[vendorName].push(component)
    return groups
  }, {})

  // Sort vendors alphabetically, with "No Vendor Assigned" at the end
  const sortedVendors = Object.keys(groupedByVendor).sort((a, b) => {
    if (a === "No Vendor Assigned") return 1
    if (b === "No Vendor Assigned") return -1
    return a.localeCompare(b)
  })

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
              Assessment Report - By Vendor
            </div>
            <div className="pdf-title">
              {assessment.unit.building.community.name} - {assessment.unit.building.name} - Unit {assessment.unit.number}
            </div>
            <div className="pdf-subtitle">Generated {generatedAt}</div>
          </div>
          {assessment.unit.building.community.logoUrl && (
            <div className="pdf-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assessment.unit.building.community.logoUrl}
                alt={`${assessment.unit.building.community.name} logo`}
                className="pdf-logo-image"
              />
            </div>
          )}
        </div>

        <div className="pdf-meta-grid">
          <div>
            <div className="pdf-meta-label">Community</div>
            <div className="pdf-meta-value">{assessment.unit.building.community.name}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Building</div>
            <div className="pdf-meta-value">{assessment.unit.building.name}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Unit</div>
            <div className="pdf-meta-value">{assessment.unit.number}</div>
          </div>
          <div>
            <div className="pdf-meta-label">Assessment Date</div>
            <div className="pdf-meta-value">
              {new Date(assessment.assessedAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="pdf-meta-label">Assessed By</div>
            <div className="pdf-meta-value">{assessment.assessedBy || "—"}</div>
          </div>
        </div>
      </div>

      {/* Components grouped by vendor - separate table for each vendor */}
      <div className="pdf-section">
        {sortedVendors.map((vendorName) => {
          const components = groupedByVendor[vendorName] || []
          
          return (
            <div key={vendorName} className="pdf-group-table-wrapper">
              {/* Component count above vendor header */}
              <div style={{ 
                fontSize: '8pt', 
                color: '#666', 
                padding: '2px 0 4px 0',
                textAlign: 'left'
              }}>
                {components.length} component{components.length !== 1 ? 's' : ''}
              </div>
              {/* Vendor Header */}
              <div 
                className="pdf-group-header"
                style={{
                  backgroundColor: "#111827",
                  background: "#111827",
                  color: "white",
                  display: "block",
                }}
              >
                {vendorName.toUpperCase()}
              </div>
              {/* Separate table for this vendor */}
              {components.length > 0 ? (
                <table className="component-table">
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>Room</th>
                      <th style={{ width: "25%" }}>Component</th>
                      <th style={{ width: "20%" }}>Condition</th>
                      <th style={{ width: "35%" }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((component) => (
                      <tr key={component.id}>
                        <td>
                          <div className="component-type-title">
                            {component.roomName}
                          </div>
                        </td>
                        <td>
                          <div className="component-type-title">
                            {component.componentName || component.componentType}
                          </div>
                          {component.componentType && component.componentName && (
                            <div className="component-material-meta">
                              {component.componentType}
                            </div>
                          )}
                        </td>
                        <td>
                          {component.condition ? (
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
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="component-notes-text">
                            {component.notes || <span className="text-muted">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  padding: "1rem", 
                  textAlign: "center", 
                  color: "#6b7280",
                  fontSize: "8pt"
                }}>
                  No components assigned to this vendor.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="print-footer">
        <div>{companyName}</div>
        <div>Generated on {generatedAt}</div>
      </div>
    </div>
  )
}




