import React from "react"
import { Link } from "react-router-dom"
import { AlertCircle, DollarSign, Brain, BarChart3, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react"

export default function ProblemStatementPage() {
    return (
        <div className="relative w-full overflow-hidden">
            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold uppercase tracking-widest mb-8">
                    <AlertCircle className="w-4 h-4" />
                    The Financial Gap
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight max-w-4xl leading-tight" style={{ fontFamily: 'serif' }}>
                    Smart Spending
                    <span className="text-white/40 block mt-2">Is Harder Than It Should Be.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                    Users lose money every day not because of a lack of offers, but because of a lack of
                    <span className="text-white font-semibold"> clarity</span>,
                    <span className="text-white font-semibold"> timing</span>, and
                    <span className="text-white font-semibold"> relevance</span>.
                </p>
            </div>

            {/* Problem Statements Section */}
            <div className="relative z-10 w-full bg-black/20 backdrop-blur-sm py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight" style={{ fontFamily: 'serif' }}>The Real Problems</h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">Financial decision fatigue is real. Here's what users actually face.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: DollarSign,
                                color: "text-red-400",
                                bg: "bg-red-500/10",
                                border: "border-red-500/20",
                                title: "Which Offer is Best?",
                                desc: "At the moment of payment, users are overwhelmed. Confirming which card gives maximum returns takes too much time."
                            },
                            {
                                icon: Brain,
                                color: "text-amber-400",
                                bg: "bg-amber-500/10",
                                border: "border-amber-500/20",
                                title: "Decision Paralysis",
                                desc: "Multiple cards, wallets, and UPI apps exist. Users don't know the optimal payment method for a specific merchant."
                            },
                            {
                                icon: BarChart3,
                                color: "text-blue-400",
                                bg: "bg-blue-500/10",
                                border: "border-blue-500/20",
                                title: "Missed Feedback Loops",
                                desc: "Skipped deals are forgotten. There is no system to track 'missed savings' or learn from past inaction."
                            },
                            {
                                icon: TrendingUp,
                                color: "text-purple-400",
                                bg: "bg-purple-500/10",
                                border: "border-purple-500/20",
                                title: "Passive Tracking",
                                desc: "Traditional apps track spending *after* it happens. They don't guide decisions *before* money leaves the account."
                            },
                            {
                                icon: Zap,
                                color: "text-orange-400",
                                bg: "bg-orange-500/10",
                                border: "border-orange-500/20",
                                title: "Category Discipline",
                                desc: "Users set goals but struggle to stick to them without real-time, category-wise nudges."
                            },
                            {
                                icon: ShieldCheck,
                                color: "text-emerald-400",
                                bg: "bg-emerald-500/10",
                                border: "border-emerald-500/20",
                                title: "Generic Advice",
                                desc: "Financial tips are often generic. Users need hyper-personalized, context-aware recommendations."
                            },
                        ].map((item, idx) => (
                            <div key={idx} className={`p-8 rounded-[2.5rem] bg-white/5 border ${item.border} hover:bg-white/10 transition-all duration-500 group`}>
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center mb-6`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'serif' }}>{item.title}</h3>
                                <p className="text-white/60 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Why It Matters */}
            <div className="relative z-10 w-full py-24 px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 backdrop-blur-xl text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight" style={{ fontFamily: 'serif' }}>
                        Why This Matters
                    </h2>
                    <p className="text-xl text-white/80 leading-relaxed mb-12">
                        This isn't just about missing a ₹50 cashback. It's about the cumulative effect of
                        <span className="text-white font-bold"> poor financial choices</span>,
                        <span className="text-white font-bold"> cognitive overload</span>, and
                        <span className="text-white font-bold"> missed savings</span>.
                        <br /><br />
                        The issue is <span className="text-emerald-400 font-bold italic">decision friction</span>, not a lack of data.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {[
                            "Missed Wealth Creation",
                            "Unnecessary User Stress",
                            "Inefficient Spending"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white/90 font-bold">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Solution & CTA */}
            <div className="relative z-10 w-full py-24 px-6 lg:px-8 text-center border-t border-white/5 bg-gradient-to-b from-black to-emerald-950/20">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-8">
                        <CheckCircle2 className="w-4 h-4" />
                        The Solution Exists
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight" style={{ fontFamily: 'serif' }}>
                        We Solved This.
                    </h2>

                    <p className="text-xl text-white/70 mb-12 leading-relaxed">
                        Our platform addresses these problems through <span className="text-white font-bold">smart scoring</span>,
                        <span className="text-white font-bold"> intelligent offer selection</span>, and
                        <span className="text-white font-bold"> behavioral learning</span>.
                        The system adapts to you.
                    </p>

                    <Link to="/">
                        <button className="group relative inline-flex items-center justify-center px-12 py-6 text-lg font-bold text-black transition-all duration-200 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:bg-zinc-200 hover:scale-105 active:scale-95">
                            <span>Experience The Solution</span>
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 animate-pulse" />
                        </button>
                    </Link>

                    <p className="mt-8 text-white/30 text-sm font-medium uppercase tracking-widest">
                        Ready for the Hackathon Demo
                    </p>
                </div>
            </div>

        </div>
    )
}
