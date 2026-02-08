import React, { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Shield, ArrowRight, RefreshCw } from "lucide-react"
import { verifyOtp, resendOtp } from "../services/api"

export default function OTPVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(new Array(6).fill(""))
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  const email = location.state?.email

  useEffect(() => {
    if (!email) {
      navigate("/signup") // Redirect if no email state
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [email, navigate])

  const handleChange = (index, e) => {
    const value = e.target.value
    if (isNaN(value)) return

    const newOtp = [...otp]
    // Allow only last entered character
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Move to next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }

    if (error) setError("")
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleVerify = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      await verifyOtp({ email, otp: otpValue })
      navigate("/login") // Or dashboard, depending on flow. Usually login after verify.
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      setLoading(true)
      await resendOtp({ email })
      setError("")
      setOtp(new Array(6).fill(""))
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
      alert("OTP sent successfully to " + email)
    } catch (err) {
      setError("Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Verification Card */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'serif' }}>Verify Your Account</h1>
            <p className="text-white/60 text-sm font-medium">Enter the verification code sent to {email}</p>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(input) => (inputRefs.current[index] = input)}
                  value={data}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all caret-white"
                />
              ))}
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="text-center">
              <p className="text-white/60 text-xs font-medium mb-3">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-white flex items-center justify-center gap-2 mx-auto hover:text-white/80 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Resend Code
              </button>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
