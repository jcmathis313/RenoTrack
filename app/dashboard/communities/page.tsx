"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CommunityForm } from "@/components/CommunityForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import Link from "next/link"
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

interface Community {
  id: string
  name: string
  address: string | null
  logoUrl: string | null
  _count: {
    buildings: number
  }
}

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  )

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities")
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

  const handleDelete = async () => {
    if (!selectedCommunity) return

    try {
      const response = await fetch(`/api/communities/${selectedCommunity.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.refresh()
        fetchCommunities()
        setDeleteOpen(false)
        setSelectedCommunity(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete community")
      }
    } catch (error) {
      console.error("Error deleting community:", error)
      alert("An error occurred while deleting the community")
    }
  }

  const handleEdit = (community: Community) => {
    setSelectedCommunity(community)
    setFormOpen(true)
  }

  const handleNew = () => {
    setSelectedCommunity(null)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    fetchCommunities()
    setSelectedCommunity(null)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
                            <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your residential communities and properties
            </p>
          </div>
          <Button onClick={handleNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Community
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Communities</CardTitle>
          </CardHeader>
          <CardContent>
            {communities.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No communities
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new community.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNew}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Community
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Buildings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communities.map((community) => (
                      <TableRow key={community.id}>
                        <TableCell className="font-medium">
                          {community.name}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {community.address || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {community._count.buildings}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(community)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCommunity(community)
                                setDeleteOpen(true)
                              }}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/communities/${community.id}`}>
                                View Buildings
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

      <CommunityForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setSelectedCommunity(null)
          }
        }}
        community={selectedCommunity || undefined}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Community"
        description="Are you sure you want to delete"
        itemName={selectedCommunity?.name}
      />
    </>
  )
}
