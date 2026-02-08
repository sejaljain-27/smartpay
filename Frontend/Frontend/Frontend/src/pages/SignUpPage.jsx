import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shield } from "lucide-react"
import { signup, googleLogin } from "../services/api" // Import API calls
import { GoogleLogin } from "@react-oauth/google" // Import Google Login

export default function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")  // Add name state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError("")

    try {
      await signup(email, password, name) // Pass name to API
      // Navigate to OTP page and pass email
      navigate("/verify-otp", { state: { email } })
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      const { data } = await googleLogin({ idToken: credentialResponse.credential })
      if (data.token) {
        localStorage.setItem("token", data.token)
        navigate("/dashboard")
      }
    } catch (err) {
      setError("Google login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Sign Up Card */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>Create Your Account</h1>
            <p className="text-white/80 text-sm font-medium">Start tracking smarter financial insights today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</div>
            )}

            <button
              disabled={loading}
              className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all shadow-lg shadow-white/5 mt-6 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Google Signup Option */}
          <div className="mt-6">
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs uppercase text-white/50 font-medium tracking-widest">OR</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Signup Failed")}
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm font-medium">
              Already have an account? <Link to="/login" className="text-white font-bold hover:underline transition-all">Login</Link>
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 flex items-start justify-center space-x-2 text-white/30 text-[10px] sm:text-xs max-w-sm mx-auto text-center leading-relaxed">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>We respect your privacy. SMS data is processed securely and never stored unnecessarily.</span>
        </div>
      </div>
    </div>
  )
}
