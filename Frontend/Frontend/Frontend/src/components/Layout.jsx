import React, { useEffect } from "react"
import { useLocation } from "react-router-dom"
import BackgroundBeams from "./ui/BackgroundBeams"
import Navbar from "./Navbar"

export default function Layout({ children }) {
  const { pathname } = useLocation()

  // Support scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white overflow-x-hidden">
      {/* Universal Fixed Background */}
      <BackgroundBeams />

      {/* Persistent Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}
