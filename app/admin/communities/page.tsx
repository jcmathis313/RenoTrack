"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Community {
  id: string
  name: string
  address: string | null
  logoUrl: string | null
  createdAt: string
  tenant: {
    id: string
    name: string
    slug: string
  }
  _count: {
    buildings: number
    units: number
  }
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [selectedTenantId])

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/admin/tenants")
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error("Error fetching tenants:", error)
    }
  }

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      const url = selectedTenantId === "all" 
        ? "/api/admin/communities"
        : `/api/admin/communities?tenantId=${selectedTenantId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCommunities(data)
      }
    } catch (error) {
      console.error("Error fetching communities:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          <p className="mt-1 text-sm text-gray-500">View all communities across tenants</p>
        </div>
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Communities</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${communities.length} communit${communities.length !== 1 ? 'ies' : 'y'} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No communities found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buildings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {communities.map((community) => (
                    <tr key={community.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {community.logoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={community.logoUrl}
                              alt={community.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {community.name[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {community.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {community.address || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{community.tenant.name}</div>
                          <div className="text-xs text-gray-400">{community.tenant.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {community._count.buildings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {community._count.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(community.createdAt).toLocaleDateString()}
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



