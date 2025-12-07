import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token as any

    // Admin routes require super admin access
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!token || !token.isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin/login", req.url))
      }
    }

    // Dashboard routes require regular authentication
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Admin login page is always accessible
        if (pathname === "/admin/login") {
          return true
        }
        
        // Admin routes require super admin
        if (pathname.startsWith("/admin")) {
          return !!(token as any)?.isSuperAdmin
        }
        
        // Dashboard routes require any authenticated user
        if (pathname.startsWith("/dashboard")) {
          return !!token
        }
        
        return true
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
