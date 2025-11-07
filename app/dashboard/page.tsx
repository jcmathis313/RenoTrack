import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRightIcon } from "@heroicons/react/24/outline"

// Mock data - will be replaced with Prisma queries
const stats = [
  { name: "Total Communities", value: "12", change: "+2", changeType: "positive" },
  { name: "Active Assessments", value: "24", change: "+5", changeType: "positive" },
  { name: "Design Projects", value: "8", change: "+1", changeType: "positive" },
  { name: "Units Assessed", value: "156", change: "+12", changeType: "positive" },
]

const quickActions = [
  { name: "New Assessment", href: "/dashboard/assessments/new", description: "Start a new unit assessment" },
  { name: "Create Design", href: "/dashboard/designs/new", description: "Begin a new design project" },
  { name: "Add Community", href: "/dashboard/communities/new", description: "Register a new community" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here&apos;s an overview of your renovation projects.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="ml-2 text-sm font-medium text-green-600">
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-primary hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary">
                        {action.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/assessments">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock recent activity - will be replaced with real data */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Assessment completed for Unit 205
                </p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <span className="text-xs text-gray-500">Community A</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Design project created for Unit 312
                </p>
                <p className="text-sm text-gray-500">5 hours ago</p>
              </div>
              <span className="text-xs text-gray-500">Community B</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New community added: Sunset Villas
                </p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
              <span className="text-xs text-gray-500">New</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
