"use client"

import React from "react"

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
  category: {
    id: string
    name: string
  }
  component: {
    id: string
    name: string
  }
}

interface RoomWithItems {
  id: string
  name: string
  type: string | null
  catalogItems: CatalogItem[]
}

interface Selection {
  id: string
  name: string
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
  rooms: RoomWithItems[]
}

interface MoodBoardPDFContentProps {
  selection: Selection
  tenantSettings: TenantSettings | null
}

export default function MoodBoardPDFContent({
  selection,
  tenantSettings,
}: MoodBoardPDFContentProps) {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1f2937" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px", borderBottom: "2px solid #e5e7eb", paddingBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#111827" }}>
              {selection.name}
            </h1>
            <p style={{ margin: "8px 0 0 0", fontSize: "16px", color: "#6b7280" }}>
              Mood Board
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#9ca3af" }}>
              {selection.unit.building.community.name} - {selection.unit.building.name} - Unit {selection.unit.number}
            </p>
          </div>
          {selection.unit.building.community.logoUrl && (
            <img
              src={selection.unit.building.community.logoUrl}
              alt="Community Logo"
              style={{
                maxHeight: "60px",
                maxWidth: "200px",
                objectFit: "contain",
              }}
            />
          )}
        </div>
      </div>

      {/* Mood Board Content */}
      {selection.rooms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            No catalog items with images found for any rooms.
          </p>
          <p style={{ fontSize: "14px" }}>
            Add components with catalog items that have photos to create a mood board.
          </p>
        </div>
      ) : (
        <div>
          {selection.rooms.map((room, roomIndex) => (
            <div
              key={room.id}
              style={{
                marginBottom: roomIndex < selection.rooms.length - 1 ? "60px" : "0",
                pageBreakInside: "avoid",
              }}
            >
              {/* Room Header */}
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  marginBottom: "24px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#111827",
                }}
              >
                {room.name}
              </h2>

              {/* Catalog Items Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "20px",
                }}
              >
                {room.catalogItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {/* Image - Square */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        backgroundColor: "#f3f4f6",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={
                            item.description ||
                            `${item.category.name} - ${item.component.name}`
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontSize: "12px",
                          }}
                        >
                          No image
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div style={{ padding: "12px" }}>
                      {item.description && (
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            margin: "0 0 6px 0",
                            color: "#111827",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: "10px",
                          margin: "0 0 4px 0",
                          color: "#4b5563",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.category.name} - {item.component.name}
                      </p>
                      {item.manufacturer && (
                        <p
                          style={{
                            fontSize: "10px",
                            margin: "0 0 4px 0",
                            color: "#6b7280",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.manufacturer}
                          {item.modelNumber && ` - ${item.modelNumber}`}
                        </p>
                      )}
                      {(item.finish || item.color) && (
                        <p
                          style={{
                            fontSize: "10px",
                            margin: "0",
                            color: "#6b7280",
                            lineHeight: "1.4",
                          }}
                        >
                          {[item.finish, item.color].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "60px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
          fontSize: "12px",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0 }}>
          Generated on {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {tenantSettings?.companyName && (
          <p style={{ margin: "4px 0 0 0" }}>{tenantSettings.companyName}</p>
        )}
      </div>
    </div>
  )
}



