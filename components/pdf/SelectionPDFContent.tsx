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

interface CatalogItem {
  id: string
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
}

interface DesignComponent {
  id: string
  componentType: string
  componentName: string | null
  condition: string | null
  materialId: string | null
  quantity: number
  unitCost: number
  totalCost: number
  notes: string | null
  residentUpgrade?: boolean | null
  material?: CatalogItem | null
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

export default function SelectionPDFContent({
  selection,
  tenantSettings,
  componentStatuses,
}: SelectionPDFContentProps) {
  const companyName = tenantSettings?.companyName || "Your Company"
  const businessAddress = tenantSettings?.businessAddress || ""
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const totalCost = selection.designRooms.reduce(
    (sum, room) =>
      sum +
      room.designComponents.reduce((roomSum, comp) => roomSum + (comp.totalCost || 0), 0),
    0
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

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
        <div className="pdf-title">Selection Report</div>
        <div className="pdf-subtitle">{selection.name}</div>
        <div className="pdf-meta">
          <div>
            <strong>Community:</strong> {selection.unit.building.community.name}
          </div>
          <div>
            <strong>Building:</strong> {selection.unit.building.name}
          </div>
          <div>
            <strong>Unit:</strong> {selection.unit.number}
          </div>
          <div>
            <strong>Status:</strong> {selection.status || "Draft"}
          </div>
          {selection.assessment && (
            <>
              <div>
                <strong>Assessment Date:</strong>{" "}
                {new Date(selection.assessment.assessedAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Assessed By:</strong> {selection.assessment.assessedBy || "N/A"}
              </div>
            </>
          )}
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
      {selection.designRooms.map((room, roomIndex) => (
        <div key={room.id} className="pdf-section">
          <div className="room-card">
            <div className="room-header">
              Room {roomIndex + 1}: {room.name}
            </div>
            {room.designComponents.length > 0 ? (
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Component / Type</th>
                    <th>Catalog Item</th>
                    <th>Upgrade</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                    <th>Condition</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {room.designComponents.map((component) => (
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
                        {component.material ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {component.material.manufacturer || "N/A"}
                            </div>
                            {component.material.modelNumber && (
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {component.material.modelNumber}
                              </div>
                            )}
                            {(component.material.finish || component.material.color) && (
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {[component.material.finish, component.material.color]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </div>
                            )}
                            {component.material.description && (
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {component.material.description}
                              </div>
                            )}
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
                      <td>{component.quantity}</td>
                      <td>{formatCurrency(component.unitCost)}</td>
                      <td>{formatCurrency(component.totalCost)}</td>
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
              <div className="text-muted">No components in this room.</div>
            )}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="summary-box">
        <div className="pdf-section-title">Summary</div>
        <div className="summary-row">
          <span>Total Rooms:</span>
          <span>{selection.designRooms.length}</span>
        </div>
        <div className="summary-row">
          <span>Total Components:</span>
          <span>
            {selection.designRooms.reduce(
              (sum, room) => sum + room.designComponents.length,
              0
            )}
          </span>
        </div>
        <div className="summary-row">
          <span>Total Cost:</span>
          <span>{formatCurrency(totalCost)}</span>
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
