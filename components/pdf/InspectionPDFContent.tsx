"use client"

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

interface InspectionComponent {
  id: string
  componentType: string
  componentName: string | null
  status: string | null // "pass" | "fail" | null
  notes: string | null
  imageUrl: string | null
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
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className="pdf-container"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#1f2937",
        lineHeight: 1.6,
      }}
    >
      {/* PDF Header */}
      <div className="pdf-header">
        <div className="pdf-title">Inspection Report</div>
        <div className="pdf-subtitle">{inspection.designProject.name}</div>
        <div className="pdf-meta">
          <div>
            <strong>Community:</strong> {inspection.designProject.unit.building.community.name}
          </div>
          <div>
            <strong>Building:</strong> {inspection.designProject.unit.building.name}
          </div>
          <div>
            <strong>Unit:</strong> {inspection.designProject.unit.number}
          </div>
          <div>
            <strong>Inspection Date:</strong> {new Date(inspection.inspectedAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Inspected By:</strong> {inspection.inspectedBy || "N/A"}
          </div>
          <div>
            <strong>Status:</strong> {inspection.status || "Draft"}
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="pdf-section">
        <div className="text-muted" style={{ fontSize: "0.875rem" }}>
          <div>{companyName}</div>
          {businessAddress && <div>{businessAddress}</div>}
          <div style={{ marginTop: "0.5rem" }}>Generated: {generatedAt}</div>
        </div>
      </div>

      {/* Rooms and Components */}
      {inspection.inspectionRooms.map((room, roomIndex) => (
        <div key={room.id} className="pdf-section">
          <div className="room-card">
            <div className="room-header">
              Room {roomIndex + 1}: {room.name}
            </div>
            {room.inspectionComponents.length > 0 ? (
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Component / Type</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {room.inspectionComponents.map((component) => (
                    <tr key={component.id}>
                      <td>
                        <div>{component.componentType}</div>
                        {component.componentName && (
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {component.componentName}
                          </div>
                        )}
                      </td>
                      <td>
                        {component.status ? (
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getInspectionStatusColor(component.status),
                            }}
                          >
                            {component.status === "pass" ? "Pass" : "Fail"}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {component.notes ? (
                          <div style={{ fontSize: "0.75rem" }}>{component.notes}</div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-muted">No components inspected in this room.</div>
            )}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="summary-box">
        <div className="pdf-section-title">Summary</div>
        <div className="summary-row">
          <span>Total Rooms:</span>
          <span>{inspection.inspectionRooms.length}</span>
        </div>
        <div className="summary-row">
          <span>Total Components:</span>
          <span>
            {inspection.inspectionRooms.reduce(
              (sum, room) => sum + room.inspectionComponents.length,
              0
            )}
          </span>
        </div>
        <div className="summary-row">
          <span>Passed:</span>
          <span>
            {inspection.inspectionRooms.reduce(
              (sum, room) => sum + room.inspectionComponents.filter((c) => c.status === "pass").length,
              0
            )}
          </span>
        </div>
        <div className="summary-row">
          <span>Failed:</span>
          <span>
            {inspection.inspectionRooms.reduce(
              (sum, room) => sum + room.inspectionComponents.filter((c) => c.status === "fail").length,
              0
            )}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="print-footer"
        style={{
          marginTop: "3rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
          fontSize: "0.75rem",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        <div>{companyName}</div>
        <div>Generated on {generatedAt}</div>
      </div>
    </div>
  )
}

