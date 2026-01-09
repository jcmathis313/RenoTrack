import { prisma } from "@/lib/prisma"

interface LogStatusChangeParams {
  tenantId: string
  entityType: "assessment" | "selection" | "inspection"
  entityId: string
  oldValue: string | null
  newValue: string | null
  userId?: string
}

export async function logStatusChange({
  tenantId,
  entityType,
  entityId,
  oldValue,
  newValue,
  userId,
}: LogStatusChangeParams) {
  try {
    // Only log if status actually changed
    if (oldValue === newValue) {
      return
    }

    const description = `${entityType} status changed from "${oldValue || "N/A"}" to "${newValue || "N/A"}"`

    await prisma.activityLog.create({
      data: {
        tenantId,
        entityType,
        entityId,
        action: "status_changed",
        oldValue,
        newValue,
        description,
        userId: userId || null,
      },
    })
  } catch (error) {
    // Don't throw - activity logging shouldn't break the main operation
    console.error("Error logging activity:", error)
  }
}








