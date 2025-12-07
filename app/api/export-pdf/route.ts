import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Increase timeout for PDF generation (Vercel default is 10s, max is 60s for Hobby, 300s for Pro)
export const maxDuration = 60

// Configure Chromium for Vercel/serverless
// Note: @sparticuz/chromium v141+ handles binary extraction automatically
// We don't need to configure setGraphicsMode for v141+

export async function GET(request: NextRequest) {
  let browser: any = null
  console.log("PDF Export: Starting PDF generation...")
  console.log("PDF Export: Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  })
  
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
        // Use type assertion for chromium properties that may not be in type definitions
        const chromiumAny = chromium as any
        
        // Set Chromium font configuration for Vercel
        // Note: @sparticuz/chromium v141+ handles fonts automatically
        // The font() method may not be available or may cause errors
        // Skip font initialization to avoid errors
        
        // Get executable path - this will download/extract Chromium if needed
        let executablePath: string
        try {
          // For @sparticuz/chromium v141+, executablePath() should handle binary extraction
          // If it fails, it means the binaries aren't available in the deployment
          executablePath = await chromiumAny.executablePath()
          console.log("PDF Export: Chromium executable path obtained:", executablePath?.substring(0, 100) + "...")
          
          // Verify the executable actually exists
          const fs = await import("fs")
          if (!fs.existsSync(executablePath)) {
            throw new Error(`Chromium executable not found at path: ${executablePath}`)
          }
        } catch (execPathError: any) {
          console.error("PDF Export: Failed to get Chromium executable path:", execPathError)
          console.error("PDF Export: Exec path error details:", {
            message: execPathError?.message,
            code: execPathError?.code,
            stack: execPathError?.stack?.substring(0, 500),
          })
          return NextResponse.json(
            {
              error: "Failed to get Chromium executable path",
              details: execPathError?.message || "Unknown error",
              type: "CHROMIUM_EXECUTABLE_ERROR",
              hint: "Chromium binaries may not be included in the deployment. Check that @sparticuz/chromium is installed correctly.",
            },
            { status: 500 }
          )
        }
        
        // Get default viewport
        const defaultViewport = chromiumAny.defaultViewport || { width: 1920, height: 1080 }
        console.log("PDF Export: Using viewport:", defaultViewport)
        
        // Get Chromium args - these are optimized for serverless
        const chromiumArgs = chromiumAny.args || []
        console.log("PDF Export: Chromium args count:", chromiumArgs.length)
        
        try {
          browser = await puppeteer.launch({
            args: [
              ...chromiumArgs,
              "--hide-scrollbars",
              "--disable-web-security",
              "--disable-gpu",
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--single-process", // Required for serverless
              "--disable-software-rasterizer", // Reduce memory usage
            ],
            defaultViewport: defaultViewport,
            executablePath: executablePath,
            headless: chromiumAny.headless !== false, // Default to true if not specified
          })
          console.log("PDF Export: Browser launched successfully in production")
        } catch (launchErr: any) {
          console.error("PDF Export: Puppeteer launch failed:", launchErr)
          console.error("PDF Export: Launch error details:", {
            message: launchErr?.message,
            code: launchErr?.code,
            executablePath,
            stack: launchErr?.stack,
          })
          throw launchErr // Re-throw to be caught by outer catch
        }
      }
      console.log("PDF Export: Browser launched successfully")
    } catch (launchError: any) {
      console.error("PDF Export: Failed to launch browser:", launchError)
      console.error("PDF Export: Launch error details:", {
        message: launchError?.message,
        stack: launchError?.stack,
        code: launchError?.code,
        name: launchError?.name,
      })
      return NextResponse.json(
        {
          error: "Failed to launch browser",
          details: launchError?.message || "Unknown error",
          type: "BROWSER_LAUNCH_ERROR",
        },
        { status: 500 }
      )
    }

    let page: any = null
    try {
      page = await browser.newPage()

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

      console.log("PDF Export: Page loaded, waiting for content to be ready...")
      
      // Wait for React to hydrate and content to render
      try {
        // First, wait for the PDF container to exist
        await page.waitForSelector(".pdf-container", { timeout: 15000 })
        console.log("PDF Export: PDF container found")
        
        // Wait for React to finish rendering - check for specific content
        await page.waitForFunction(
          () => {
            const container = document.querySelector('.pdf-container')
            if (!container) return false
            
            // Check if we have actual content (not just empty divs)
            const hasText = container.textContent && container.textContent.trim().length > 100
            const tables = container.querySelectorAll('table')
            const hasTables = tables.length > 0
            
            // Check that tables have rows (not just headers)
            let hasTableRows = false
            if (hasTables) {
              tables.forEach((table) => {
                const rows = table.querySelectorAll('tbody tr')
                if (rows.length > 0) {
                  hasTableRows = true
                }
              })
            }
            
            return (hasText || hasTables) && hasTableRows
          },
          { timeout: 20000 }
        )
        console.log("PDF Export: Content rendered and ready")
        
        // Additional wait to ensure all React components are fully rendered
        await page.waitForFunction(
          () => {
            const container = document.querySelector('.pdf-container')
            if (!container) return false
            
            // Count all table rows across all tables
            const tables = container.querySelectorAll('table')
            let totalRows = 0
            tables.forEach((table) => {
              const rows = table.querySelectorAll('tbody tr')
              totalRows += rows.length
            })
            
            // Wait until we have at least some rows, and then wait a bit more for any lazy-loaded content
            return totalRows > 0
          },
          { timeout: 10000 }
        )
        
        // Wait a bit more to ensure all content is stable
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Additional wait for any animations or transitions to complete
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (selectorError: unknown) {
        console.error("PDF Export: Could not find or wait for content")
        console.error("PDF Export: Error details:", selectorError)
        
        // Try to get page content for debugging
        try {
          const pageContent = await page.content()
          const contentLength = pageContent.length
          const hasPdfContainer = pageContent.includes('pdf-container')
          console.error("PDF Export: Debug info:", {
            contentLength,
            hasPdfContainer,
            first500Chars: pageContent.substring(0, 500)
          })
        } catch (debugError) {
          console.error("PDF Export: Could not get page content for debugging")
        }
        
        const errorMessage = selectorError instanceof Error ? selectorError.message : "Unknown error"
        throw new Error(`PDF content not found or not fully rendered: ${errorMessage}`)
      }

      // Wait for all images to load - with better error handling
      console.log("PDF Export: Waiting for images to load...")
      await page.evaluate(() => {
        return Promise.allSettled(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<string>((resolve) => {
                  img.onload = () => resolve("Image loaded")
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
      }).then((results: PromiseSettledResult<string>[]) => {
        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
          console.log(`PDF Export: ${failed} image(s) failed to load, continuing anyway...`)
        }
      }).catch(() => {
        console.log("PDF Export: Error waiting for images, continuing anyway...")
      })

      // Wait for CSS to be fully applied and fonts to load
      console.log("PDF Export: [STEP 1] Waiting for CSS and fonts to load...")
      console.log("PDF Export: [STEP 1] Current URL:", page.url())
      try {
        // Wait for all fonts to be loaded and ensure text is visible
        await page.evaluate(async () => {
          // Wait for fonts to load (including Google Fonts from CDN)
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready
          }
          
          // Wait additional time for font files to download from CDN
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Find all text-containing elements in the PDF container
          const pdfContainer = document.querySelector('.pdf-container')
          if (!pdfContainer) {
            console.error('PDF Export: PDF container not found!')
            return
          }
          
          // Get all elements that might contain text
          const allElements = pdfContainer.querySelectorAll('*')
          
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              // Skip if element has no text content
              if (!el.textContent || el.textContent.trim().length === 0) {
                return
              }
              
              // Skip pills and group headers - they should have white text
              if (el.classList.contains('status-pill') || 
                  el.classList.contains('upgrade-badge') || 
                  el.classList.contains('pdf-group-header')) {
                return
              }
              
              const computedStyle = window.getComputedStyle(el)
              const color = computedStyle.color
              const visibility = computedStyle.visibility
              const display = computedStyle.display
              const opacity = computedStyle.opacity
              
              // Force text to be visible with explicit black color
              // Check if text might be invisible
              if (color === 'rgba(0, 0, 0, 0)' || 
                  color === 'transparent' || 
                  color === 'rgb(255, 255, 255)' ||
                  color === 'rgba(255, 255, 255, 1)' ||
                  visibility === 'hidden' ||
                  display === 'none' ||
                  opacity === '0') {
                
                // Set explicit black color for text
                el.style.color = '#111827 !important'
                el.style.visibility = 'visible !important'
                el.style.opacity = '1 !important'
                
                if (display === 'none') {
                  // Don't change display if it's a table element
                  if (el.tagName !== 'TABLE' && el.tagName !== 'TD' && el.tagName !== 'TH' && el.tagName !== 'TR') {
                    el.style.display = 'block'
                  }
                }
              }
              
              // Ensure font family has fallbacks
              const currentFont = computedStyle.fontFamily
              if (currentFont && !currentFont.includes('sans-serif')) {
                el.style.fontFamily = `"${currentFont.split(',')[0].replace(/['"]/g, '')}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
              }
              
              // Force minimum font size to ensure text is visible
              const fontSize = computedStyle.fontSize
              if (fontSize && parseFloat(fontSize) < 6) {
                el.style.fontSize = '8px'
              }
            }
          })
          
          // Also ensure all text nodes are visible
          const walker = document.createTreeWalker(
            pdfContainer,
            NodeFilter.SHOW_TEXT,
            null
          )
          
          let textNode
          while (textNode = walker.nextNode()) {
            const parent = textNode.parentElement
            if (parent) {
              // Skip pills and group headers - they should have white text
              if (parent.classList.contains('status-pill') || 
                  parent.classList.contains('upgrade-badge') || 
                  parent.classList.contains('pdf-group-header')) {
                continue
              }
              
              const style = window.getComputedStyle(parent)
              if (style.color === 'rgba(0, 0, 0, 0)' || 
                  style.color === 'transparent' || 
                  style.visibility === 'hidden' ||
                  style.opacity === '0') {
                parent.style.color = '#111827'
                parent.style.visibility = 'visible'
                parent.style.opacity = '1'
              }
            }
          }
        })
        console.log("PDF Export: [STEP 1] Fonts and CSS loaded, text visibility ensured")
        
        // Verify text is actually visible by checking a sample
        const sampleText = await page.evaluate(() => {
          const container = document.querySelector('.pdf-container')
          if (!container) return { found: false, sample: null, textLength: 0 }
          
          const allText = container.textContent || ''
          const first100Chars = allText.substring(0, 100)
          return {
            found: true,
            sample: first100Chars,
            textLength: allText.length,
            hasTables: container.querySelectorAll('table').length > 0
          }
        })
        
        console.log("PDF Export: [STEP 1] Text verification:", JSON.stringify(sampleText))
        
      } catch (fontError: unknown) {
        const errorMsg = fontError instanceof Error ? fontError.message : String(fontError)
        console.warn("PDF Export: [STEP 1] Font/visibility check failed, but continuing:", errorMsg)
      }
      
      // Wait a bit more for any dynamic content to render
      console.log("PDF Export: [STEP 2] Waiting for final rendering...")
      await new Promise((resolve) => setTimeout(resolve, 3000))
      
      // Ensure the page height is calculated correctly and force reflow
      console.log("PDF Export: [STEP 3] Ensuring layout is correct...")
      await page.evaluate(() => {
        // Force layout recalculation
        document.body.style.height = 'auto'
        document.body.style.minHeight = '100vh'
        
        // Trigger a reflow to ensure all styles are applied
        const container = document.querySelector('.pdf-container')
        if (container && container instanceof HTMLElement) {
          container.offsetHeight // Force reflow
        }
        
        // Ensure all tables are visible
        const tables = document.querySelectorAll('table')
        tables.forEach((table) => {
          if (table instanceof HTMLElement) {
            table.style.display = 'table'
            table.style.visibility = 'visible'
          }
        })
      })

      console.log("PDF Export: [STEP 4] Generating PDF...")
      
      // Ensure print CSS is used
      await page.emulateMediaType("print")
      
      const footerTemplate = `
        <div style="width: 100%; font-size: 8pt; color: #6b7280; text-align: right; padding: 0 0.4in; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
      
      // All PDFs use landscape orientation for consistent formatting
      const isPortrait = false

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
      if (page) {
        try {
          const pageContent = await page.content().catch(() => null)
          if (pageContent) {
            console.error("PDF Export: Page content (first 500 chars):", pageContent.substring(0, 500))
          }
        } catch (contentError: unknown) {
          console.error("PDF Export: Could not get page content:", contentError)
        }
      }
      
      if (browser) {
        try {
          await browser.close()
        } catch (closeError: unknown) {
          console.error("PDF Export: Error closing browser:", closeError)
        }
        browser = null
      }
      
      const errorDetails: any = {
        error: "Failed to generate PDF",
        details: pageError?.message || "Unknown error",
        type: "PDF_GENERATION_ERROR",
      }
      
      // Only include stack in development or if explicitly requested
      if (process.env.NODE_ENV === "development" || request.nextUrl.searchParams.get("debug") === "true") {
        errorDetails.stack = pageError?.stack
      }
      
      return NextResponse.json(errorDetails, { status: 500 })
    }
  } catch (error: any) {
    console.error("PDF Export: Fatal error:", error)
    console.error("PDF Export: Error stack:", error?.stack)
    
    if (browser) {
      try {
        await browser.close()
      } catch (closeError: unknown) {
        // Ignore close errors
      }
    }
    
    const errorDetails: any = {
      error: "Failed to generate PDF",
      details: error?.message || "Unknown error",
      type: "FATAL_ERROR",
    }
    
    // Only include stack in development or if explicitly requested
    if (process.env.NODE_ENV === "development" || request.nextUrl.searchParams.get("debug") === "true") {
      errorDetails.stack = error?.stack
    }
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
}
