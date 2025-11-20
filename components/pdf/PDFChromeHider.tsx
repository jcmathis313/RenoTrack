"use client"

import { useEffect } from "react"

export default function PDFChromeHider() {
  useEffect(() => {
    // Add class to body to identify PDF pages
    document.body.classList.add("pdf-page")
    
    // Hide only the dashboard navigation header, not PDF content headers
    const dashboardHeaders = document.querySelectorAll('header.sticky, header.flex.h-16, aside')
    dashboardHeaders.forEach((el) => {
      // Only hide if it's not a PDF header
      if (el instanceof HTMLElement && !el.classList.contains('pdf-header') && !el.classList.contains('pdf-group-header')) {
        el.style.display = 'none'
      }
    })
    
    // Remove layout constraints
    const layoutElements = document.querySelectorAll('.h-screen, .overflow-hidden')
    layoutElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.height = 'auto'
        el.style.minHeight = '100vh'
        el.style.overflow = 'visible'
      }
    })
    
    return () => {
      document.body.classList.remove("pdf-page")
    }
  }, [])
  
  return null
}

