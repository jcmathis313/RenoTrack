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

interface AssessmentPDFContentProps {
  assessment: Assessment
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

export default function AssessmentPDFContent({
  assessment,
  tenantSettings,
  componentStatuses,
}: AssessmentPDFContentProps) {
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
        <div className="pdf-title">Assessment Report</div>
        <div className="pdf-subtitle">
          {assessment.unit.building.community.name} - {assessment.unit.building.name} - Unit {assessment.unit.number}
        </div>
        <div className="pdf-meta">
          <div>
            <strong>Community:</strong> {assessment.unit.building.community.name}
          </div>
          <div>
            <strong>Building:</strong> {assessment.unit.building.name}
          </div>
          <div>
            <strong>Unit:</strong> {assessment.unit.number}
          </div>
          <div>
            <strong>Assessment Date:</strong> {new Date(assessment.assessedAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Assessed By:</strong> {assessment.assessedBy || "N/A"}
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
      {assessment.rooms.map((room, roomIndex) => (
        <div key={room.id} className="pdf-section">
          <div className="room-card">
            <div className="room-header">
              Room {roomIndex + 1}: {room.name}
            </div>
            {room.componentAssessments.length > 0 ? (
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Component / Type</th>
                    <th>Condition</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {room.componentAssessments.map((component) => (
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
                        {component.condition ? (
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getStatusColor(component.condition, componentStatuses),
                            }}
                          >
                            {component.condition}
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
              <div className="text-muted">No components assessed in this room.</div>
            )}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="summary-box">
        <div className="pdf-section-title">Summary</div>
        <div className="summary-row">
          <span>Total Rooms:</span>
          <span>{assessment.rooms.length}</span>
        </div>
        <div className="summary-row">
          <span>Total Components:</span>
          <span>
            {assessment.rooms.reduce(
              (sum, room) => sum + room.componentAssessments.length,
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

