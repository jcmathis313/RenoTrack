"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline"
import { signOut } from "next-auth/react"

const navigation = [
  { name: "Overview", href: "/admin", icon: HomeIcon },
  { name: "Tenants", href: "/admin/tenants", icon: BuildingOffice2Icon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Communities", href: "/admin/communities", icon: ChartBarIcon },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <div className="flex h-full w-[236px] flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto">
        <div className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Bottom navigation */}
        <div className="mt-auto pt-4 border-t border-gray-200 space-y-1">
          <button
            onClick={handleSignOut}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  )
}



