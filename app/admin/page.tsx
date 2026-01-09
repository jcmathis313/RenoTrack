"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BuildingOffice2Icon,
  UsersIcon,
  HomeIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

interface Stats {
  overview: {
    tenants: number
    users: number
    communities: number
    buildings: number
    units: number
    assessments: number
    recentActivity: number
  }
  tenants: Array<{
    id: string
    name: string
    slug: string
    createdAt: string
    _count: {
      users: number
      communities: number
    }
  }>
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load statistics</div>
      </div>
    )
  }

  const statCards = [
    {
      name: "Tenants",
      value: stats.overview.tenants,
      icon: BuildingOffice2Icon,
      description: "Organizations",
    },
    {
      name: "Users",
      value: stats.overview.users,
      icon: UsersIcon,
      description: "Total users",
    },
    {
      name: "Communities",
      value: stats.overview.communities,
      icon: HomeIcon,
      description: "Total communities",
    },
    {
      name: "Buildings",
      value: stats.overview.buildings,
      icon: BuildingOffice2Icon,
      description: "Total buildings",
    },
    {
      name: "Units",
      value: stats.overview.units,
      icon: HomeIcon,
      description: "Total units",
    },
    {
      name: "Assessments",
      value: stats.overview.assessments,
      icon: ChartBarIcon,
      description: "Total assessments",
    },
    {
      name: "Recent Activity",
      value: stats.overview.recentActivity,
      icon: ClockIcon,
      description: "Last 30 days",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-500">System-wide statistics and tenant information</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Organizations using the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tenants found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Communities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant._count.users}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant._count.communities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






