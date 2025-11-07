"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  BuildingOffice2Icon,
  ClipboardDocumentCheckIcon,
  PaintBrushIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"

interface Community {
  id: string
  name: string
}

interface Building {
  id: string
  name: string
  communityId: string
}



const topLevelNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Assessments", href: "/dashboard/assessments", icon: ClipboardDocumentCheckIcon },
  { name: "Selections", href: "/dashboard/selections", icon: PaintBrushIcon },
  { name: "Inspections", href: "/dashboard/inspections", icon: ClipboardDocumentListIcon },
  { name: "Product Catalog", href: "/dashboard/catalog", icon: BookOpenIcon },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [communities, setCommunities] = useState<Community[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-expand based on current pathname
  useEffect(() => {
    if (!pathname || loading) return

    // Check if we're on a building page - expand its community
    const buildingMatch = pathname.match(/\/dashboard\/buildings\/([^/]+)/)
    if (buildingMatch) {
      const buildingId = buildingMatch[1]
      const building = buildings.find((b) => b.id === buildingId)
      if (building) {
        // Expand the community
        setExpandedCommunities((prev) => new Set(prev).add(building.communityId))
      }
    }

    // Check if we're on a community page - expand it
    const communityMatch = pathname.match(/\/dashboard\/communities\/([^/]+)/)
    if (communityMatch && !buildingMatch) {
      const communityId = communityMatch[1]
      setExpandedCommunities((prev) => new Set(prev).add(communityId))
    }
  }, [pathname, buildings, loading])

  const fetchData = async () => {
    try {
      // Fetch communities
      const commResponse = await fetch("/api/communities")
      if (commResponse.ok) {
        const communitiesData = await commResponse.json()
        setCommunities(communitiesData)

        // Fetch buildings for all communities
        const allBuildings: Building[] = []
        for (const community of communitiesData) {
          const buildingsResponse = await fetch(`/api/buildings?communityId=${community.id}`)
          if (buildingsResponse.ok) {
            const buildingsData = await buildingsResponse.json()
            allBuildings.push(...buildingsData)
          }
        }
        setBuildings(allBuildings)
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCommunity = (communityId: string) => {
    const newExpanded = new Set(expandedCommunities)
    if (newExpanded.has(communityId)) {
      newExpanded.delete(communityId)
    } else {
      newExpanded.add(communityId)
    }
    setExpandedCommunities(newExpanded)
  }

  const isCommunityExpanded = (communityId: string) => expandedCommunities.has(communityId)

  const getCommunityBuildings = (communityId: string) =>
    buildings.filter((b) => b.communityId === communityId)

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r border-gray-200", className)}>
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">RenoTrack</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Top level navigation items */}
        {topLevelNavigation.map((item) => {
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

        {/* Communities section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Communities
            </h2>
          </div>

          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : communities.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No communities</div>
          ) : (
            communities.map((community) => {
              const communityBuildings = getCommunityBuildings(community.id)
              const isExpanded = isCommunityExpanded(community.id)
              const isCommunityActive =
                pathname === `/dashboard/communities/${community.id}` ||
                pathname?.startsWith(`/dashboard/communities/${community.id}/`)

              return (
                <div key={community.id}>
                  {/* Community item */}
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCommunity(community.id)}
                      className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronRightIcon
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          isExpanded && "transform rotate-90"
                        )}
                      />
                    </button>
                    <Link
                      href={`/dashboard/communities/${community.id}`}
                      className={cn(
                        "flex-1 flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors truncate",
                        isCommunityActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <BuildingOffice2Icon
                        className={cn(
                          "mr-2 h-3.5 w-3.5 flex-shrink-0",
                          isCommunityActive
                            ? "text-primary-foreground"
                            : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      <span className="truncate">{community.name}</span>
                    </Link>
                  </div>

                  {/* Buildings for this community */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {communityBuildings.length === 0 ? (
                        <div className="px-8 py-1 text-xs text-gray-400">No buildings</div>
                      ) : (
                        communityBuildings.map((building) => {
                          const isBuildingActive =
                            pathname === `/dashboard/buildings/${building.id}` ||
                            pathname?.startsWith(`/dashboard/buildings/${building.id}/`)

                          return (
                            <Link
                              key={building.id}
                              href={`/dashboard/buildings/${building.id}`}
                              className={cn(
                                "flex items-center px-3 py-1 text-xs rounded-md transition-colors truncate",
                                isBuildingActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              )}
                            >
                              <BuildingOfficeIcon
                                className={cn(
                                  "mr-2 h-3 w-3 flex-shrink-0",
                                  isBuildingActive ? "text-primary" : "text-gray-400"
                                )}
                              />
                              <span className="truncate">{building.name}</span>
                            </Link>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Add Community link */}
          <Link
            href="/dashboard/communities"
            className={cn(
              "flex items-center px-3 py-2 mt-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/dashboard/communities"
                ? "bg-primary text-primary-foreground"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span className="mr-3 text-lg">+</span>
            Manage Communities
          </Link>
        </div>
      </nav>
    </div>
  )
}
