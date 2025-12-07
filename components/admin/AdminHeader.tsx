"use client"

export function AdminHeader() {
  return (
    <div className="lg:hidden relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <div className="flex-1 px-4 flex justify-between sm:px-6">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

