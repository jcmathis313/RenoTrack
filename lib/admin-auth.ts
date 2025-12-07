import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || !user.isSuperAdmin) {
    throw new Error("Unauthorized: Super admin access required")
  }
  return user
}

