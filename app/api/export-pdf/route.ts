import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import puppeteer from "puppeteer"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
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

    // Launch Puppeteer
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      })
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
        const domain = urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" 
          ? urlObj.hostname // Keep localhost as-is for cookie domain
          : urlObj.hostname.replace(":3000", "") // Remove port for other domains
        
        const cookieArray = cookiePairs
          .map((cookie) => {
            const [name, ...valueParts] = cookie.split("=")
            const value = valueParts.join("=") // Handle values that contain =
            if (!name || !value) return null
            return {
              name: name.trim(),
              value: decodeURIComponent(value),
              domain: domain,
              path: "/",
              httpOnly: false,
              secure: baseUrl.startsWith("https"),
              sameSite: "Lax" as const,
            }
          })
          .filter((c): c is NonNullable<typeof c> => c !== null)

        if (cookieArray.length > 0) {
          await page.setCookie(...cookieArray)
          console.log(`PDF Export: Set ${cookieArray.length} cookies for domain: ${domain}`)
        }
      } else {
        console.warn("PDF Export: No cookies found in request")
      }

      console.log("PDF Export: Navigating to PDF URL...")
      await page.goto(pdfUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      })

      console.log("PDF Export: Page loaded, waiting for PDF container...")
      // Wait for content to be ready
      await page.waitForSelector(".pdf-container", { timeout: 15000 })

      // Wait for all images to load
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve, reject) => {
                  img.onload = resolve
                  img.onerror = reject
                  // Timeout after 5 seconds
                  setTimeout(() => reject(new Error("Image load timeout")), 5000)
                })
            )
        )
      }).catch(() => {
        console.log("Some images may not have loaded, continuing anyway...")
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
      
      // Generate PDF with professional settings
      const pdfBuffer = await page.pdf({
        format: "Letter",
        landscape: true,
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
      
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error("PDF Export: Error closing browser:", closeError)
        }
        browser = null
      }
      
      throw new Error(`PDF generation failed: ${pageError?.message || "Unknown error"}`)
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
