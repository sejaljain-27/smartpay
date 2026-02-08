import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { login } from "../services/api";

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
      setError(err.response?.data?.message || "Login failed");
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

          <div className="mt-10 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/30 tracking-widest">
                  or
                </span>
              </div>
            </div>
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
