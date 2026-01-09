"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  entityType: "assessment" | "selection" | "inspection"
  entityId: string
  entityName: string
  entityLink: string
  oldValue: string | null
  newValue: string | null
  description: string
  createdAt: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "assessment":
        return "Assessment"
      case "selection":
        return "Selection"
      case "inspection":
        return "Inspection"
      default:
        return type
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "text-gray-500"
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes("complete") || lowerStatus.includes("completed")) {
      return "text-green-600"
    }
    if (lowerStatus.includes("progress") || lowerStatus.includes("pending")) {
      return "text-blue-600"
    }
    if (lowerStatus.includes("draft")) {
      return "text-gray-600"
    }
    return "text-gray-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start justify-between py-2 ${
                index > 0 ? "border-t border-gray-200" : ""
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  <Link
                    href={activity.entityLink}
                    className="hover:text-primary transition-colors"
                  >
                    {getEntityTypeLabel(activity.entityType)} status changed
                  </Link>
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  {activity.oldValue && (
                    <>
                      <span className={getStatusColor(activity.oldValue)}>
                        {activity.oldValue}
                      </span>
                      <span>→</span>
                    </>
                  )}
                  <span className={getStatusColor(activity.newValue)}>
                    {activity.newValue || "N/A"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}








