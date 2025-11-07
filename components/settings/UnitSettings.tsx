"use client"

import { StatusListManager } from "./StatusListManager"

export function UnitSettings() {
  return (
    <div className="space-y-6">
      <StatusListManager
        title="Rooms"
        description="Manage room types available for units"
        apiEndpoint="/api/settings/room-template"
        defaultItems={[]}
      />
    </div>
  )
}
