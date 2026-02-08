import React from "react"
import { ArrowRight, Star, Shield, Smartphone, PenTool, BarChart3, Target, Lightbulb, Lock } from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-6">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" style={{ fontFamily: 'serif' }}>
          SMART-PAY
        </h1>

        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-16 font-light">
          We don't just track expenses—we optimize every decision.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/signup">
            <button className="px-12 py-6 rounded-full border border-white/10 bg-white/5 text-white text-lg font-medium hover:bg-white/10 transition-all min-w-[200px]">
              Sign Up
            </button>
          </Link>
          <Link to="/login">
            <button className="px-12 py-6 rounded-full bg-white/10 text-white text-lg font-medium hover:bg-white/20 transition-all min-w-[200px] backdrop-blur-sm">
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* Sections Wrapper */}
      <div className="relative z-10 w-full">
        {/* Features Section - Core Capabilities */}
        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-20 tracking-tight" style={{ fontFamily: 'serif' }}>
              Core Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Smartphone, title: "SMS-Based Tracking", desc: "Automatic expense logging from your transaction alerts." },
                { icon: PenTool, title: "Smart Categorization", desc: "Advanced logic that understands where your money goes." },
                { icon: BarChart3, title: "Expense Analytics", desc: "Visualize spending trends with intuitive charts." },
                { icon: Target, title: "Monthly Goals", desc: "Set and track budgets for different categories." },
                { icon: Lightbulb, title: "Card Offer Intelligence", desc: "Maximize rewards with personalized card suggestions." },
                { icon: Shield, title: "Explainable Insights", desc: "Understand the 'why' behind every financial tip." },
              ].map((feature, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:translate-y-[-4px] transition-all">
                  <feature.icon className="w-8 h-8 text-white/80 mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/80 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Security Section */}
        <section className="py-24 px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Lock className="w-12 h-12 text-white/80 mx-auto mb-8" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight" style={{ fontFamily: 'serif' }}>
              Built with Privacy First
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-16">
              {[
                { title: "On-Device Processing", desc: "SMS parsing happens only on your device. Never in the cloud." },
                { title: "No Payments", desc: "We are a tracker, not a payment processor. No money moves here." },
                { title: "Secure API", desc: "All communication is encrypted with industry-standard protocols." },
                { title: "Zero Raw Storage", desc: "We never store raw SMS data. Only extracted insights." },
                { title: "Explainable Logic", desc: "Clear decision making with no black-box algorithms." },
                { title: "User Owned", desc: "Your data is yours. Export or delete it at any time." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <Shield className="w-5 h-5 text-white/60 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-white/70 text-sm leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="py-12 px-6 lg:px-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-white/40 text-sm">
          <div className="font-medium tracking-widest" style={{ fontFamily: 'serif' }}>SMART-PAY</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
