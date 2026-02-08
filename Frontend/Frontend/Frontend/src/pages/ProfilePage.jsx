import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  User, Mail, Phone, MapPin, Calendar,
  Settings, Lock, ShieldCheck, HelpCircle,
  Moon, Bell, LogOut, CheckCircle, Edit3,
  Zap, Award, ChevronRight, RefreshCcw
} from "lucide-react"
import ProfileLocationMap from "../components/ProfileLocationMap"

import { getProfile, getSavings, getTransactions, getSmartScore } from "../services/api" // Import API

// ... existing imports
import { updateProfile } from "../services/api"

// ... existing component start
export default function ProfilePage() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editForm, setEditForm] = useState({
    phone: "",
    location: ""
  })

  const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lng: null })

  const detectLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setMapCoordinates({ lat: latitude, lng: longitude })

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        const data = await response.json()
        const city = data.address.city || data.address.town || data.address.village || data.address.state || "Detected Location"

        setUser(prev => ({ ...prev, location: city }))
        setEditForm(prev => ({ ...prev, location: city }))
      } catch (e) {
        console.error("Reverse geocoding failed", e)
      }
    }, (err) => {
      console.error("Location access denied or failed", err)
    })
  }

  // Auto-detect location on mount if not already set or just refresh coordinate
  React.useEffect(() => {
    detectLocation()
  }, [])

  // State for user data
  const [user, setUser] = useState({
    name: "Loading...",
    initials: "..",
    membership: "Standard Member",
    email: "...",
    phone: "Not set",
    location: "Earth",
    memberSince: "Jan 2026",
    smartScore: 0,
    totalSaved: "₹0",
    transactions: 0
  })

  // Fetch Profile on Mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Starting fetchProfile...")

        console.log("Fetching /auth/me...")
        const profileRes = await getProfile().catch(err => {
          console.error("Profile fetch failed:", err)
          throw err
        })
        console.log("Profile fetched:", profileRes.data)

        console.log("Fetching savings...")
        const savingsRes = await getSavings().catch(err => {
          console.error("Savings fetch failed:", err)
          return { totalSavings: 0 }
        })

        console.log("Fetching transactions...")
        const txRes = await getTransactions({ limit: 1000 }).catch(err => {
          console.error("Transactions fetch failed:", err)
          return { data: [] }
        })

        console.log("Fetching smart score...")
        const scoreRes = await getSmartScore().catch(err => {
          console.error("Score fetch failed:", err)
          return { data: { smartScore: 0 } }
        })

        const data = profileRes.data
        const savings = savingsRes.totalSavings || 0
        const txCount = txRes.data ? txRes.data.length : 0

        setUser(prev => ({
          ...prev,
          name: data.name || "User",
          initials: (data.name || "U").slice(0, 2).toUpperCase(),
          email: data.email,
          phone: data.phone || "Not set",
          location: data.location || "Earth",
          memberSince: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalSaved: `₹${savings}`,
          transactions: txCount,
          smartScore: scoreRes.data.smartScore || 0
        }))

        setEditForm({
          phone: data.phone || "",
          location: data.location || ""
        })
      } catch (err) {
        console.error("Failed to fetch profile", err)
        setError(err.message || "Failed to load profile data.")
        setUser(prev => ({ ...prev, name: "Error loading profile" }))
      } finally {
        console.log("Finished fetchProfile")
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateProfile(editForm)
      setUser(prev => ({
        ...prev,
        phone: updated.data.phone || prev.phone,
        location: updated.data.location || prev.location
      }))
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update profile", err)
      alert("Failed to update profile")
    }
  }

  const handleLogout = () => {
    console.log("User logged out")
    localStorage.removeItem("token") // Clear token
    navigate("/")
  }

  const settings = [
    { title: "General Settings", desc: "Update your basic information and language", icon: Settings },
    { title: "Privacy & Security", desc: "Manage your data sharing and password", icon: Lock },
    { title: "Card Security", desc: "Configuration for NFC and limits", icon: ShieldCheck },
    { title: "Help & Support", desc: "Get assistance with your transactions", icon: HelpCircle },
  ]

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto py-12 px-6">

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 rotate-180" /> {/* Using LogOut as close icon for now or just X */}
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 font-serif">Edit Profile</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium">Default Location</label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center space-x-3 focus-within:border-white/30 transition-colors">
                  <MapPin className="w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. New York, USA"
                    className="bg-transparent border-none outline-none text-white w-full placeholder-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium">Phone Number</label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center space-x-3 focus-within:border-white/30 transition-colors">
                  <Phone className="w-5 h-5 text-white/40" />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. +1 234 567 890"
                    className="bg-transparent border-none outline-none text-white w-full placeholder-white/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>Profile</h1>
        <p className="text-white/60 text-lg font-medium">Manage your account and preferences</p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          <p className="text-white/40 mt-4">Loading profile...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
          <p className="font-bold">Error loading profile</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: User Profile & Impact */}
          <div className="lg:col-span-1 space-y-8">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-8 right-8 p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center text-center">
                {/* ... rest of the component */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-2 border-white/10 mb-6 shadow-2xl">
                  <span className="text-3xl font-serif text-white">{user.initials}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <span className="px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                  {user.membership}
                </span>

                <div className="w-full h-px bg-white/5 mb-6" />

                <div className="flex items-center justify-center space-x-2 text-white/40">
                  <Award className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Smart Score: {user.smartScore}</span>
                </div>
              </div>
            </div>

            {/* Impact Metrics Card */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Your Impact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl font-serif text-white mb-1">{user.totalSaved}</p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Saved</p>
                </div>
                <div className="text-center border-x border-white/5">
                  <p className="text-xl font-serif text-white mb-1">{user.smartScore}</p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-serif text-white mb-1">{user.transactions}</p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Txs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Preferences, Settings */}
          <div className="lg:col-span-2 space-y-8">

            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Mail, label: "Email Address", val: user.email },
                { icon: Phone, label: "Phone Number", val: user.phone },
                { icon: MapPin, label: "Location", val: user.location, isLocation: true },
                { icon: Calendar, label: "Member Since", val: user.memberSince },
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-6 ${item.isLocation ? "block" : "flex items-center space-x-4"}`}>
                  {item.isLocation ? (
                    <div>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                          <item.icon className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
                            <button
                              onClick={detectLocation}
                              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                              title="Refresh Location"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-white">{item.val}</p>
                        </div>
                      </div>
                      <ProfileLocationMap lat={mapCoordinates.lat} lng={mapCoordinates.lng} />
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        <item.icon className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-white">{item.val}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Preferences */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h3 className="text-white font-bold text-lg mb-8" style={{ fontFamily: 'serif' }}>Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Dark Mode</p>
                      <p className="text-white/30 text-xs">Adjust the app's appearance</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-white' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all ${isDarkMode ? 'left-7 bg-black' : 'left-1 bg-white/20'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Notifications</p>
                      <p className="text-white/30 text-xs">Balance and offer alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-white' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all ${notifications ? 'left-7 bg-black' : 'left-1 bg-white/20'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h3 className="text-white font-bold text-lg mb-8" style={{ fontFamily: 'serif' }}>Account Settings</h3>
              <div className="space-y-2">
                {settings.map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group group-hover:px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all text-white/40 group-hover:text-white">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm">{item.title}</p>
                        <p className="text-white/30 text-[10px] font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center space-x-3 group active:scale-[0.98]"
            >
              <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              <span>Log Out Account</span>
            </button>

          </div>
        </div>
      )}

      {/* Footer Meta */}
      <div className="mt-24 text-center">
        <div className="inline-flex items-center space-x-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>SmartPay v1.0.0 · Made with ❤️ for smart spenders</span>
        </div>
      </div>
    </div>
  )
}
