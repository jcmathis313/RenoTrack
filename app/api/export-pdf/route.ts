import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Increase timeout for PDF generation (Vercel default is 10s, max is 60s for Hobby, 300s for Pro)
export const maxDuration = 60

// Configure Chromium for Vercel/serverless (if available)
// Note: setGraphicsMode may not be available in all versions
// Using type assertion to avoid TypeScript errors
if (typeof (chromium as any).setGraphicsMode === 'function') {
  (chromium as any).setGraphicsMode(false)
}

export async function GET(request: NextRequest) {
  let browser: any = null
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error("PDF Export: Unauthorized - No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "selection", "assessment", etc.
    const id = searchParams.get("id")
    const variant = searchParams.get("variant") // "rooms" or "categories" for selections

    if (!type || !id) {
      console.error("PDF Export: Missing parameters", { type, id })
      return NextResponse.json(
        { error: "Type and ID parameters are required" },
        { status: 400 }
      )
    }

    // Build the PDF route URL
    // Use NEXT_PUBLIC_BASE_URL if set, otherwise use the request origin
    // For Vercel, request.nextUrl.origin will be the deployment URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    console.log("PDF Export: Base URL:", baseUrl)
    let pdfRoute = ""

    switch (type) {
      case "selection":
        pdfRoute = `/dashboard/selections/${id}/pdf`
        // Add variant parameter if provided
        if (variant) {
          pdfRoute += `?variant=${variant}`
        }
        break
      case "assessment":
        pdfRoute = `/dashboard/assessments/${id}/pdf`
        break
      case "inspection":
        pdfRoute = `/dashboard/inspections/${id}/pdf`
        break
      default:
        return NextResponse.json(
          { error: "Invalid PDF type" },
          { status: 400 }
        )
    }

    const pdfUrl = `${baseUrl}${pdfRoute}`
    console.log("PDF Export: Generating PDF for URL:", pdfUrl)

    // Launch Puppeteer with Chromium optimized for serverless
    try {
      // Determine if we're in development (localhost) or production-like (Vercel)
      // VERCEL=1 means we're on Vercel (staging or production)
      const isDev = process.env.NODE_ENV === "development" && process.env.VERCEL !== "1"
      
      if (isDev) {
        // Development: Use local Puppeteer installation
        const puppeteerDev = await import("puppeteer")
        console.log("PDF Export: Launching browser in development mode...")
        
        // Try to launch with executable path if available, otherwise let puppeteer find it
        const launchOptions: any = {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-extensions",
          ],
          timeout: 60000, // Increase timeout to 60 seconds
        }
        
        // Try to use system Chrome if available (faster than downloading Chromium)
        const { execSync } = await import("child_process")
        try {
          // Check for Chrome in common locations on macOS
          const chromePaths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
          
          for (const chromePath of chromePaths) {
            try {
              const fs = await import("fs")
              if (fs.existsSync(chromePath)) {
                launchOptions.executablePath = chromePath
                console.log(`PDF Export: Using Chrome at ${chromePath}`)
                break
              }
            } catch {
              // Continue to next path
            }
          }
        } catch {
          // If we can't find system Chrome, puppeteer will download Chromium
          console.log("PDF Export: Using Puppeteer's bundled Chromium")
        }
        
        browser = await puppeteerDev.default.launch(launchOptions)
        console.log("PDF Export: Browser launched successfully in development")
      } else {
        // Production (Vercel): Use @sparticuz/chromium
        console.log("PDF Export: Launching browser in production mode (Vercel)")
        browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            "--hide-scrollbars",
            "--disable-web-security",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--single-process", // Required for serverless
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        })
        console.log("PDF Export: Browser launched successfully in production")
      }
      console.log("PDF Export: Browser launched successfully")
    } catch (launchError: any) {
      console.error("PDF Export: Failed to launch browser:", launchError)
      throw new Error(`Failed to launch browser: ${launchError?.message || "Unknown error"}`)
    }

    try {
      const page = await browser.newPage()

      // Set viewport for consistent rendering - use large height to capture all content
      await page.setViewport({
        width: 1920,
        height: 10000, // Large height to ensure all content is visible
        deviceScaleFactor: 2,
      })

      // Get cookies from the request
      const cookieHeader = request.headers.get("cookie")
      if (cookieHeader) {
        console.log("PDF Export: Setting cookies for authentication")
        // Parse cookies properly - handle NextAuth session cookie
        const cookiePairs = cookieHeader.split(";").map((c) => c.trim())
        const urlObj = new URL(baseUrl)
        
        // Determine if we're on localhost or a remote domain (Vercel)
        const isLocalhost = urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1"
        
        const cookieArray = cookiePairs
          .map((cookie) => {
            const [name, ...valueParts] = cookie.split("=")
            const value = valueParts.join("=") // Handle values that contain =
            if (!name || !value) return null
            
            const cookieObj: {
              name: string
              value: string
              path: string
              httpOnly: boolean
              secure: boolean
              sameSite: "Lax" | "None" | "Strict"
              domain?: string
              url?: string
            } = {
              name: name.trim(),
              value: decodeURIComponent(value),
              path: "/",
              httpOnly: false,
              secure: baseUrl.startsWith("https"),
              sameSite: baseUrl.startsWith("https") ? "None" : "Lax", // Use None for HTTPS cross-site
            }
            
            // Puppeteer requires either 'url' or 'domain' to be set
            // Using 'url' is more reliable across different environments (localhost and Vercel)
            cookieObj.url = baseUrl
            
            return cookieObj
          })
          .filter((c): c is NonNullable<typeof c> => c !== null)

        if (cookieArray.length > 0) {
          // Set cookies one by one for better error handling
          for (const cookie of cookieArray) {
            try {
              await page.setCookie(cookie)
            } catch (cookieError: any) {
              console.warn(`PDF Export: Failed to set cookie ${cookie.name}:`, cookieError.message)
            }
          }
          console.log(`PDF Export: Set ${cookieArray.length} cookies using URL: ${baseUrl}`)
        }
      } else {
        console.warn("PDF Export: No cookies found in request")
      }

      console.log("PDF Export: Navigating to PDF URL:", pdfUrl)
      const navigationResponse = await page.goto(pdfUrl, {
        waitUntil: "networkidle0",
        timeout: 60000, // Increase timeout for Vercel serverless
      })

      if (!navigationResponse) {
        throw new Error("Navigation failed - no response received")
      }

      const finalUrl = page.url()
      console.log("PDF Export: Navigation complete. Final URL:", finalUrl)

      // Check if we were redirected to login
      if (finalUrl.includes("/login")) {
        throw new Error("Authentication failed - redirected to login page. Check cookie configuration.")
      }

      console.log("PDF Export: Page loaded, waiting for PDF container...")
      // Wait for content to be ready
      await page.waitForSelector(".pdf-container", { timeout: 15000 }).catch((selectorError) => {
        console.error("PDF Export: Could not find .pdf-container selector")
        throw new Error(`PDF content not found: ${selectorError.message}`)
      })

      // Wait for all images to load - with better error handling
      await page.evaluate(() => {
        return Promise.allSettled(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve, reject) => {
                  img.onload = resolve
                  img.onerror = () => {
                    // Hide broken images instead of failing
                    img.style.display = "none"
                    resolve("Image failed to load, hidden")
                  }
                  // Timeout after 5 seconds
                  setTimeout(() => {
                    img.style.display = "none"
                    resolve("Image load timeout, hidden")
                  }, 5000)
                })
            )
        )
      }).then((results) => {
        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
          console.log(`PDF Export: ${failed} image(s) failed to load, continuing anyway...`)
        }
      }).catch(() => {
        console.log("PDF Export: Error waiting for images, continuing anyway...")
      })

      // Wait a bit more for any dynamic content to render
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Ensure the page height is calculated correctly
      await page.evaluate(() => {
        // Force layout recalculation
        document.body.style.height = 'auto'
        document.body.style.minHeight = '100vh'
      })

      console.log("PDF Export: Generating PDF...")
      
      // Ensure print CSS is used
      await page.emulateMediaType("print")
      
      const footerTemplate = `
        <div style="width: 100%; font-size: 8pt; color: #6b7280; text-align: right; padding: 0 0.4in; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
      
      // Determine if PDF should be portrait (inspections) or landscape (selections, assessments)
      const isPortrait = type === "inspection"

      // Generate PDF with professional settings
      const pdfBuffer = await page.pdf({
        format: "Letter",
        landscape: !isPortrait, // Portrait for inspections, landscape for others
        margin: {
          top: "0.4in",
          right: "0.4in",
          bottom: "0.5in",
          left: "0.4in",
        },
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: footerTemplate,
      })

      console.log(`PDF Export: PDF generated successfully (${pdfBuffer.length} bytes)`)
      await browser.close()
      browser = null

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}-${id}-${Date.now()}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      })
    } catch (pageError: any) {
      console.error("PDF Export: Error during PDF generation:", pageError)
      console.error("PDF Export: Error stack:", pageError?.stack)
      console.error("PDF Export: Error details:", {
        message: pageError?.message,
        name: pageError?.name,
        code: pageError?.code,
      })
      
      // Try to get more details from the page if possible
      try {
        const pageContent = await page.content().catch(() => null)
        if (pageContent) {
          console.error("PDF Export: Page content (first 500 chars):", pageContent.substring(0, 500))
        }
      } catch (contentError) {
        console.error("PDF Export: Could not get page content:", contentError)
      }
      
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error("PDF Export: Error closing browser:", closeError)
        }
        browser = null
      }
      
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          details: pageError?.message || "Unknown error",
          stack: process.env.NODE_ENV === "development" ? pageError?.stack : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("PDF Export: Fatal error:", error)
    console.error("PDF Export: Error stack:", error?.stack)
    
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        // Ignore close errors
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
