import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Target, TrendingUp, Sparkles } from "lucide-react"
import { getTransactions, sendChatMessage, getCategoryGoals } from "../services/api"

export default function CategoryGoalDetailsPage() {
    const { categoryName } = useParams()
    const navigate = useNavigate()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [analysis, setAnalysis] = useState("")
    const [goal, setGoal] = useState(null)
    const [analyzing, setAnalyzing] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, goalsRes] = await Promise.all([
                    getTransactions({ limit: 50 }),
                    getCategoryGoals()
                ])

                // Filter transactions for this category
                const catTx = txRes.data.filter(t => t.category === categoryName || (categoryName === 'Food' && t.category === 'Dining'))
                setTransactions(catTx)

                const currentGoal = goalsRes.data.find(g => g.category === categoryName)
                setGoal(currentGoal)

                // Trigger AI Analysis
                analyzeSpending(catTx, currentGoal)

            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [categoryName])

    const analyzeSpending = async (txs, goalData) => {
        setAnalyzing(true)
        const totalSpent = txs.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
        const prompt = `I have spent ₹${totalSpent} on ${categoryName} recently. My goal limit is ₹${goalData ? goalData.limit_amount : 'N/A'}. 
    Suggest 3 specific, actionable alternatives to save money in this category. Be concise.`

        try {
            const res = await sendChatMessage(prompt)
            setAnalysis(res.data.reply || "No specific insights available currently.")
        } catch (err) {
            setAnalysis("Unable to generate AI insights at this moment.")
        } finally {
            setAnalyzing(false)
        }
    }

    const spendAmount = transactions.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    const limitAmount = goal ? Number(goal.limit_amount) : 0
    const percentage = limitAmount > 0 ? (spendAmount / limitAmount) * 100 : 0

    return (
        <div className="relative z-10 w-full max-w-4xl mx-auto py-20 px-6">
            <button onClick={() => navigate("/dashboard")} className="flex items-center text-white/60 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>

            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'serif' }}>{categoryName} Insights</h1>
                <p className="text-white/60">Deep dive into your spending and find smarter alternatives.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Progress Card */}
                <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2rem] p-8 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Current Spend</p>
                            <h3 className="text-4xl font-serif text-white">₹{spendAmount}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Goal Limit</p>
                            <h3 className="text-4xl font-serif text-white/50">₹{limitAmount}</h3>
                        </div>
                    </div>

                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${percentage > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    <p className={`text-sm font-bold ${percentage > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {percentage.toFixed(0)}% of budget used
                    </p>
                </div>

                {/* AI Insight Card */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles className="w-24 h-24 text-indigo-400" /></div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" /> AI Analyst
                    </h3>

                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center h-32 space-y-3">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/40 text-xs animate-pulse">Analyzing spending patterns...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm">
                            <p className="text-white/80 whitespace-pre-line leading-relaxed">{analysis}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-xl font-bold text-white mb-6">Recent {categoryName} Transactions</h3>
                <div className="space-y-4">
                    {loading ? <p className="text-white/30">Loading...</p> : transactions.length === 0 ? <p className="text-white/30">No transactions found.</p> : (
                        transactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-white font-bold">{tx.text}</p>
                                    <p className="text-white/40 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                                <p className="text-white font-serif">₹{tx.amount}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    )
}
