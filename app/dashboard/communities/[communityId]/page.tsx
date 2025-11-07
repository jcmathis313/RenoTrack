"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BuildingForm } from "@/components/BuildingForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import Link from "next/link"
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

interface Building {
  id: string
  name: string
  address: string | null
  _count: {
    units: number
  }
}

interface Community {
  id: string
  name: string
}

export default function BuildingsPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.communityId as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [communityId])

  const fetchData = async () => {
    try {
      // Fetch community info
      const commResponse = await fetch("/api/communities")
      if (commResponse.ok) {
        const communities = await commResponse.json()
        const foundCommunity = communities.find((c: Community) => c.id === communityId)
        if (foundCommunity) {
          setCommunity(foundCommunity)
        }
      }

      // Fetch buildings
      const response = await fetch(`/api/buildings?communityId=${communityId}`)
      if (response.ok) {
        const data = await response.json()
        setBuildings(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return

    try {
      const response = await fetch(`/api/buildings/${selectedBuilding.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.refresh()
        fetchData()
        setDeleteOpen(false)
        setSelectedBuilding(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete building")
      }
    } catch (error) {
      console.error("Error deleting building:", error)
      alert("An error occurred while deleting the building")
    }
  }

  const handleEdit = (building: Building) => {
    setSelectedBuilding(building)
    setFormOpen(true)
  }

  const handleNew = () => {
    setSelectedBuilding(null)
    setFormOpen(true)
  }

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter((building) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const name = building.name.toLowerCase()
    const address = (building.address || "").toLowerCase()

    return name.includes(query) || address.includes(query)
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!community) {
    return <div>Community not found</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/communities">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Communities
                </Link>
              </Button>
            </div>
                            <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Buildings in {community.name}
            </p>
          </div>
          <Button onClick={handleNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Building
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search buildings by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            {buildings.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No buildings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new building.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNew}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Building
                  </Button>
                </div>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No buildings found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuildings.map((building) => (
                      <TableRow key={building.id}>
                        <TableCell className="font-medium">
                          {building.name}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {building.address || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {building._count.units}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(building)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBuilding(building)
                                setDeleteOpen(true)
                              }}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/buildings/${building.id}`}>
                                View Units
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BuildingForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setSelectedBuilding(null)
          }
        }}
        communityId={communityId}
        building={selectedBuilding || undefined}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Building"
        description="Are you sure you want to delete"
        itemName={selectedBuilding?.name}
      />
    </>
  )
}
