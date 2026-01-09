import { Sidebar } from "@/components/Sidebar"
import { MobileHeader } from "@/components/MobileHeader"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <MobileHeader />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-3">
            <div className="px-3 sm:px-4 md:px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
