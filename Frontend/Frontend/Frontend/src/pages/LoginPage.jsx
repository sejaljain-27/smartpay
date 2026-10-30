import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { login, googleLogin } from "../services/api";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await login(email, password);
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/about-to-pay");
      } else {
        setError("No token received. Check backend response.");
      }
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.message ||
        (err.response?.status === 404
          ? "API not found — check VITE_API_BASE_URL matches your backend."
          : null) ||
        err.message ||
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await googleLogin({ idToken: credentialResponse.credential });
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/about-to-pay");
      }
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.error ||
          data?.message ||
          (err.response?.status === 404
            ? "API not found — set VITE_API_BASE_URL to your backend URL."
            : "Google login failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-10">
            <h1
              className="text-3xl font-bold text-white mb-3"
              style={{ fontFamily: "serif" }}
            >
              Welcome Back
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Log in to continue optimizing your financial insights.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>
            <div>
              <label className="block text-white/65 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-light"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-center font-bold">{error}</div>
            )}

            <button
              className="w-full h-12 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all shadow-lg shadow-white/5 mt-4"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Google Login Option */}
          <div className="mt-6">
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs uppercase text-white/50 font-medium tracking-widest">
                OR
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="flex w-full justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                theme="filled_black"
                shape="pill"
                size="large"
                width={384}
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm font-medium">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-white font-bold hover:underline transition-all"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-white/30 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>
            Secure authentication. Your financial data remains private.
          </span>
        </div>
      </div>
    </div>
  );
}
