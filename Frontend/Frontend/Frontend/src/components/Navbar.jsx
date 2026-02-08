import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Zap, CreditCard, LogIn,
  History as HistoryIcon, Target, User, LogOut, Sparkles,
  Menu, X
} from "lucide-react"

import { logout } from "../services/api"

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const isLandingPage = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "AI Coach", path: "/chat", icon: Sparkles },
    { name: "Smart Pay", path: "/about-to-pay", icon: Zap },
    { name: "Goals", path: "/goals", icon: Target },
    { name: "History", path: "/history", icon: HistoryIcon },
    { name: "Cards", path: "/cards", icon: CreditCard },
    { name: "Profile", path: "/profile", icon: User },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="relative z-20 w-full pt-6">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Name */}
          <Link to="/" className="flex items-center group relative z-50">
            <span className="text-2xl font-bold text-white tracking-widest group-hover:text-white/80 transition-colors" style={{ fontFamily: 'serif' }}>SMART-PAY</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Nav Links - Only visible when NOT on landing/auth pages */}
            {!isLandingPage && !isAuthPage && (
              <div className="flex items-center space-x-8 mr-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center space-x-2 text-sm font-bold uppercase tracking-widest transition-all ${pathname === link.path ? 'text-white' : 'text-white/40 hover:text-white/60'
                      }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Auth Button - Only visible when NOT on landing/auth pages */}
            {!isLandingPage && !isAuthPage && (
              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-full border border-red-500/20 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile View Toggle */}
          <div className="md:hidden relative z-50">
            {!isLandingPage && !isAuthPage && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && !isLandingPage && !isAuthPage && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
          <div className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-4 text-xl font-bold uppercase tracking-widest py-3 border-b border-white/5 ${pathname === link.path ? 'text-emerald-400' : 'text-white/60'
                  }`}
              >
                <link.icon className="w-6 h-6" />
                <span>{link.name}</span>
              </Link>
            ))}

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="mt-8 px-6 py-4 w-full rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest flex items-center justify-center space-x-3"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
