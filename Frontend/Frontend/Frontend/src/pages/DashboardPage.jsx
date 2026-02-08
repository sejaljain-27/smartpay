import React, { useState, useEffect } from "react"
import { Search, Bell, Menu, ArrowUpRight, ArrowDownRight, User, Wallet, PieChart, BarChart3, TrendingUp, Target, Zap, ChevronRight, MessageSquare, CheckCircle2, CreditCard } from "lucide-react"
import AddSmsModal from "../components/AddSmsModal"
import SpendingBehavior from "../components/Dashboard/SpendingBehavior"
import GoalMomentumArrow from "../components/Dashboard/GoalMomentumArrow"
import { getTransactions, getDashboardData, getGoalProgress, getSmartScore, getCategoryGoals } from "../services/api" // Import getDashboardData and getSmartScore

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [categoryGoals, setCategoryGoals] = useState([]) // New State
  const [insights, setInsights] = useState({
    totalExpense: 0,
    totalSavings: 0,
    category: [],
    daily: [],
    weekly: [],
    monthly: [],
    behavior: []
  })
  const [smartScore, setSmartScore] = useState(0)
  const [goal, setGoal] = useState(null)
  const [missedOpportunities, setMissedOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const [txData, dashboardData, goalRes, scoreRes, catGoalsRes] = await Promise.all([
        getTransactions({ limit: 100 }), // Fetch recent transactions for insights
        getDashboardData(),
        getGoalProgress(monthStr).catch(() => ({ data: null })),
        getSmartScore().catch(() => ({ data: { smartScore: 0 } })),
        getCategoryGoals().catch(() => ({ data: [] }))
      ])
      setTransactions(txData.data)

      // Calculate Missed Opportunities from transactions
      // Assuming GET /transactions returns ignored_offer/missed_saving_amount fields
      const missed = txData.data.filter(tx => tx.ignored_offer === true || tx.ignored_offer === 'true');
      setMissedOpportunities(missed);

      setInsights(dashboardData)
      setGoal(goalRes.data)
      setCategoryGoals(catGoalsRes.data)
      setSmartScore(scoreRes.data.smartScore || 0)
    } catch (err) {
      console.error("Dashboard Fetch Error:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate savings (mock logic for now as savings isn't directly in insights yet, using random for demo or 0)
  // In a real app, backend should return total savings.
  const totalSavings = 0

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto py-12 px-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>Dashboard</h1>
          <p className="text-white/60 text-lg font-medium">Track your savings and smart payment decisions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/10 shrink-0"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Add via SMS</span>
        </button>
      </div>

      <AddSmsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={fetchData}
      />

      <div className="space-y-8">

        {/* Savings Goal Card */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex items-center justify-between">
            {/* Savings Info */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Savings Goal</span>
              </div>
              <h3 className="text-4xl font-serif text-white mb-1">
                ₹{goal ? Number(goal.spent).toLocaleString() : '0'}
                <span className="text-lg text-white/40 font-sans ml-2">/ ₹{goal ? Number(goal.target).toLocaleString() : '0'}</span>
              </h3>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                {goal && goal.percentage >= 100 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Goal Achieved!
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {goal ? (goal.target - goal.spent).toLocaleString() : '0'} remaining
                  </>
                )}
              </p>
            </div>

            {/* Intelligent Arrow (Centered) */}
            {goal && (
              <GoalMomentumArrow
                netSavings={insights.totalSavings}
                goalAmount={goal.target}
                goalAchieved={goal.percentage >= 100}
              />
            )}

            {/* Goal Progress Circle */}
            <div className="relative flex-none">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (Math.min(goal ? goal.percentage : 0, 100) / 100) * 251.2}
                  className={`transition-all duration-1000 ease-out ${goal && goal.percentage >= 100 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                    goal && goal.percentage >= 75 ? 'text-emerald-500' : 'text-emerald-600'
                    }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{goal ? Math.round(goal.percentage) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown INSIDE Savings Goal */}
          {categoryGoals.length > 0 && (
            <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
              <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Category Limits</h4>
              <div className="space-y-4">
                {categoryGoals.map((catGoal) => {
                  // Find spend for this category
                  const catSpend = insights.category.find(c => c.category === catGoal.category);
                  const spendAmount = catSpend ? Math.abs(Number(catSpend.total)) : 0;
                  const percent = Math.min((spendAmount / Number(catGoal.limit_amount)) * 100, 100);

                  return (
                    <div
                      key={catGoal.id}
                      onClick={() => window.location.href = `/goals/category/${catGoal.category}`}
                      className="group cursor-pointer hover:bg-white/5 p-4 rounded-2xl transition-all border border-transparent hover:border-white/5 relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-white font-bold text-lg block">{catGoal.category}</span>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1 mt-1">
                            View Details <ChevronRight className="w-3 h-3" />
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-serif text-white block">₹{spendAmount}</span>
                          <span className="text-white/30 text-xs font-medium">of ₹{catGoal.limit_amount} goal</span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                        <span className="text-white/30">{percent.toFixed(0)}% Used</span>
                        {percent > 80 && (
                          <span className="text-amber-400 animate-pulse">Approaching Limit</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Wallet className="w-6 h-6 text-white/60" />
              </div>
              <span className={`text-sm font-bold uppercase tracking-wider ${insights.bankName ? 'bg-white/10 px-3 py-1 rounded-lg text-white border border-white/10' : 'text-white/40'}`}>
                {insights.bankName || '--'}
              </span>
            </div>
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Total Expenses</p>
            <h3 className="text-6xl font-serif text-white mb-2 leading-none">₹{insights.totalExpense}</h3>

            {insights.availableBalance !== undefined && insights.availableBalance !== null ? (
              <p className="text-emerald-400 text-sm font-medium mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Avl Bal: <span className="font-bold text-white">₹{Number(insights.availableBalance).toLocaleString()}</span>
              </p>
            ) : (
              <p className="text-white/30 text-xs font-medium italic">All time</p>
            )}
          </div>

          <SpendingBehavior />

          {/* ... (Smart Score - keeping static/placeholder) ... */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
            {/* ... */}
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Smart Score</p>
            <h3 className="text-6xl font-serif text-white mb-4 leading-none">{smartScore}/100</h3>
            {/* ... */}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif' }}>Daily Trend</h3>

            </div>
            {/* Premium SVG Area Chart for Daily Trend */}
            <div className="w-full relative group">
              {(() => {
                // 1. Process Data: Fill missing days for the last 7 days
                const today = new Date();
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(today.getDate() - (6 - i)); // 6 days ago to today
                  return d.toISOString().split('T')[0];
                });

                const dataMap = new Map((insights.daily || []).map(item => [
                  new Date(item.date).toISOString().split('T')[0],
                  Math.abs(Number(item.total)) // FIX: Handle negative expense values
                ]));
                const chartData = last7Days.map(date => ({
                  date,
                  value: dataMap.get(date) || 0,
                  label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
                  fullDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) // Feb 12
                }));

                const maxVal = Math.max(...chartData.map(d => d.value), 100); // Min max 100 for scale

                // Insight Generation
                const maxDay = chartData.reduce((prev, curr) => (curr.value >= prev.value ? curr : prev), { value: -1 });
                const totalPeriodSpend = chartData.reduce((sum, d) => sum + d.value, 0);

                let insightText = "No spending activity this week.";
                if (totalPeriodSpend > 0) {
                  insightText = `Highest spending observed on ${new Date(maxDay.date).toLocaleDateString('en-US', { weekday: 'long' })} (₹${maxDay.value})`;
                }

                if (chartData.every(d => d.value === 0)) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
                      <BarChart3 className="w-8 h-8 opacity-50" />
                      <span className="text-sm font-medium">No spending data for this period</span>
                    </div>
                  );
                }

                // 2. Generate SVG Path with Padding
                // Chart Area: x: 10 to 90, y: 10 to 90 (Padding for labels)
                const PADDING_X = 10;
                const PADDING_Top = 10;
                const HEIGHT = 80;
                const WIDTH = 80; // 100 - 2*PADDING

                const points = chartData.map((d, i) => {
                  const x = PADDING_X + (i / (chartData.length - 1)) * WIDTH;
                  const y = (PADDING_Top + HEIGHT) - (d.value / maxVal) * HEIGHT;
                  return `${x},${y}`;
                });

                const linePath = `M ${points.join(' L ')}`;
                const areaPath = `${linePath} L ${PADDING_X + WIDTH},${PADDING_Top + HEIGHT} L ${PADDING_X},${PADDING_Top + HEIGHT} Z`;

                return (
                  <div className="flex flex-col">
                    <div className="relative w-full h-60 charts-container pl-2">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full"> {/* overflow-visible REMOVED */}
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Y-Axis Grid Lines */}
                        <line x1={PADDING_X} y1={PADDING_Top + HEIGHT} x2={PADDING_X + WIDTH} y2={PADDING_Top + HEIGHT} stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
                        <line x1={PADDING_X} y1={PADDING_Top + HEIGHT / 2} x2={PADDING_X + WIDTH} y2={PADDING_Top + HEIGHT / 2} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" strokeDasharray="2" />
                        <line x1={PADDING_X} y1={PADDING_Top} x2={PADDING_X + WIDTH} y2={PADDING_Top} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" strokeDasharray="2" />

                        {/* Y-Axis Labels (Inside SVG, aligned left of padding) */}
                        <text x={PADDING_X - 2} y={PADDING_Top + 2} fontSize="3" fill="white" opacity="0.5" textAnchor="end">₹{Math.round(maxVal)}</text>
                        <text x={PADDING_X - 2} y={PADDING_Top + HEIGHT / 2 + 1} fontSize="3" fill="white" opacity="0.5" textAnchor="end">₹{Math.round(maxVal / 2)}</text>
                        <text x={PADDING_X - 2} y={PADDING_Top + HEIGHT} fontSize="3" fill="white" opacity="0.5" textAnchor="end">0</text>

                        {/* Area Fill */}
                        <path d={areaPath} fill="url(#trendGradient)" />

                        {/* Stroke Line with Glow */}
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="url(#glow)" />

                        {/* Data Points */}
                        {chartData.map((d, i) => {
                          const x = PADDING_X + (i / (chartData.length - 1)) * WIDTH;
                          const y = (PADDING_Top + HEIGHT) - (d.value / maxVal) * HEIGHT;
                          return (
                            <g key={i} className="group/point cursor-pointer">
                              {/* Invisible hit area */}
                              <circle cx={x} cy={y} r="4" fill="transparent" />
                              {/* Visible Dot */}
                              <circle cx={x} cy={y} r="1.5" className="fill-emerald-950 stroke-emerald-400 stroke-[0.5] transition-all duration-300 group-hover/point:r-3 group-hover/point:stroke-white" />

                              {/* Tooltip - Rendered as foreignObject ABOVE points */}
                              <foreignObject x={x < 50 ? x : x - 30} y={y - 25} width="60" height="40" className="overflow-visible opacity-0 group-hover/point:opacity-100 transition-opacity z-50 pointer-events-none">
                                <div className={`bg-zinc-900 border border-emerald-500/30 text-white p-1.5 rounded-md text-center shadow-xl transform ${x < 50 ? 'origin-bottom-left' : 'origin-bottom-right'}`}>
                                  <div className="text-[8px] font-bold whitespace-nowrap">₹{d.value}</div>
                                  <div className="text-[6px] text-white/50 whitespace-nowrap">{d.fullDate}</div>
                                </div>
                              </foreignObject>
                            </g>
                          );
                        })}

                      </svg>
                    </div>

                    {/* X-Axis Labels (Static Block, Not Absolute) */}
                    <div className="w-full flex justify-between mt-2 px-4 h-6 shrink-0">
                      {chartData.map((d, i) => (
                        <div key={i} style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
                          <span className="text-[9px] font-bold text-white/40 uppercase block">{d.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* INSIGHT TEXT */}
                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-white/60 text-xs font-medium">{insightText}</span>
                      </div>
                      {totalPeriodSpend > 0 && (
                        <div className="text-white text-xs font-bold">
                          Total: <span className="text-emerald-300">₹{totalPeriodSpend}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Spending by Category Widget (Restored & Styled) */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif' }}>Spending by Category</h3>
              <BarChart3 className="w-5 h-5 text-white/20" />
            </div>

            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {(() => {
                // 1. Process Data
                let absCategories = (insights.category || []).map(c => ({ ...c, absTotal: Math.abs(Number(c.total)) }));

                // Merge Dining into Food
                const dining = absCategories.find(c => c.category === 'Dining');
                if (dining) {
                  const foodIndex = absCategories.findIndex(c => c.category === 'Food');
                  if (foodIndex >= 0) {
                    absCategories[foodIndex].absTotal += dining.absTotal;
                    absCategories = absCategories.filter(c => c.category !== 'Dining');
                  } else {
                    dining.category = 'Food';
                  }
                }

                // Sort by spend (descending)
                absCategories.sort((a, b) => b.absTotal - a.absTotal);

                const maxCatVal = Math.max(...absCategories.map(c => c.absTotal), 1);

                return absCategories.map((item, i) => {
                  const width = (item.absTotal / maxCatVal) * 100;

                  return (
                    <div key={i} className="group">
                      <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-xs font-bold text-white/60 uppercase tracking-widest group-hover:text-white transition-colors truncate max-w-[150px]">{item.category}</span>
                        <span className="text-lg font-bold text-white font-serif">₹{item.absTotal}</span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 transition-all group-hover:bg-white/[0.08]">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}

              {(insights.category || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2 py-10">
                  <PieChart className="w-8 h-8 opacity-50" />
                  <span className="text-sm font-medium">No category data yet</span>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* PERFORMANCE INSIGHTS SECTION */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'serif' }}>Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 1. Best Choice Rate */}
            {(() => {
              const opportunities = transactions.filter(t => t.text.includes("(Saved") || t.ignored_offer);
              const taken = opportunities.filter(t => !t.ignored_offer).length;
              const total = opportunities.length;
              const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

              return (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">Best Choice Rate</h4>
                      <span className="text-3xl font-serif text-white">{rate}%</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs font-medium">You're choosing optimal cards most of the time!</p>
                </div>
              );
            })()}

            {/* 2. Top Performing Card */}
            {(() => {
              const cardSavings = {};
              const cardUsage = {};

              // Fallback keywords for common banks if regex fails
              const commonBanks = ["HDFC", "SBI", "ICICI", "Axis", "Kotak", "Amex", "Citi", "OneCard", "Amazon Pay", "Paytm"];

              transactions.forEach(t => {
                const text = t.text || "";

                // 1. App Format: "Paid to X using Y (Saved Z)"
                // Matches: "using HDFC Infinia (" or "using Standard Payment" at end
                const appMatch = text.match(/using\s+(.*?)(?:\s+\(|$)/i);

                // 2. SMS Formats:
                // "debited from HDFC Bank on..." -> HDFC Bank
                // "spent on HDFC Credit Card..." -> HDFC Credit Card
                // "debited via UPI from Axis Bank..." -> Axis Bank
                let smsMatch = text.match(/(?:from|via)\s+(.*?)(?:\s+(?:on|for|at)|$)/i);

                // Refine SMS match: if it says "via UPI from X", we want X.
                const detailedFrom = text.match(/from\s+(.*?)(?:\s+(?:on|for|at)|$)/i);
                if (detailedFrom) smsMatch = detailedFrom;

                let cardName = null;

                if (appMatch && appMatch[1]) {
                  cardName = appMatch[1].trim();
                } else if (smsMatch && smsMatch[1]) {
                  // Clean up common SMS noise
                  let clean = smsMatch[1].replace(/account|ending|xx\d+/gi, "").trim();
                  // If it's just "UPI", try to look for bank name elsewhere or keep it?
                  if (clean.length > 2) cardName = clean;
                }

                // 3. Keyword/Hard Fallback: If still null, check for known banks in text
                if (!cardName) {
                  const upperText = text.toUpperCase();
                  const foundBank = commonBanks.find(bank => upperText.includes(bank.toUpperCase()));
                  if (foundBank) cardName = foundBank + " Card";
                }

                if (cardName && cardName.toLowerCase() !== "merchant") {
                  // Standardize formatting (Title Case)
                  cardName = cardName.charAt(0).toUpperCase() + cardName.slice(1);

                  cardUsage[cardName] = (cardUsage[cardName] || 0) + 1;

                  const savedMatch = text.match(/\(Saved ₹(\d+(\.\d+)?)\)/);
                  if (savedMatch) {
                    const savings = parseFloat(savedMatch[1]);
                    cardSavings[cardName] = (cardSavings[cardName] || 0) + savings;
                  }
                }
              });

              // Strategy: Prioritize Savings, then Usage
              const bestCardBySavings = Object.entries(cardSavings).sort((a, b) => b[1] - a[1])[0];
              const bestCardByUsage = Object.entries(cardUsage).sort((a, b) => b[1] - a[1])[0];

              let displayCard = "No Data";
              let displaySub = "No activity yet";

              if (bestCardBySavings) {
                displayCard = bestCardBySavings[0];
                displaySub = `Saved ₹${bestCardBySavings[1]} this month`;
              } else if (bestCardByUsage) {
                displayCard = bestCardByUsage[0];
                displaySub = `Used ${bestCardByUsage[1]} times`;
              }

              return (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">Top Performing Card</h4>
                      <span className="text-lg font-bold text-white truncate max-w-[150px] block" title={displayCard}>{displayCard}</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs font-medium">{displaySub}</p>
                </div>
              );
            })()}

            {/* 3. Avg Savings / Transaction */}
            {(() => {
              // 1. Real Savings (Priority)
              const savingsTx = transactions.filter(t => t.text.includes("(Saved"));
              const totalSavings = savingsTx.reduce((acc, t) => {
                const match = t.text.match(/\(Saved ₹(\d+(\.\d+)?)\)/);
                return acc + (match ? parseFloat(match[1]) : 0);
              }, 0);
              const avgReal = savingsTx.length > 0 ? Math.round(totalSavings / savingsTx.length) : 0;

              // 2. Missed Savings (Secondary)
              const missedTx = transactions.filter(t => t.missed_saving_amount && Number(t.missed_saving_amount) > 0);
              const totalMissed = missedTx.reduce((acc, t) => acc + Number(t.missed_saving_amount), 0);
              const avgMissed = missedTx.length > 0 ? Math.round(totalMissed / missedTx.length) : 0;

              // 3. Potential Estimate (Fallback for SMS users)
              // Calculate avg transaction amount first
              const avgTxAmount = transactions.length > 0
                ? Math.round(transactions.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / transactions.length)
                : 0;
              const avgPotential = Math.round(avgTxAmount * 0.015); // 1.5% conservative estimate

              let displayVal = 0;
              let subText = "";

              if (avgReal > 0) {
                displayVal = avgReal;
                subText = "Consistent savings on every spend";
              } else if (avgMissed > 0) {
                displayVal = avgMissed;
                subText = "Avg. missed savings (Offer Ignored)";
              } else {
                displayVal = avgPotential; // Show estimate instead of 0
                subText = "Est. potential savings (1.5%)";
              }

              return (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">Avg. Savings / Tx</h4>
                      <span className="text-3xl font-serif text-white">₹{displayVal}</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs font-medium">
                    {subText}
                  </p>
                </div>
              );
            })()}

          </div>
        </div>

        {/* MISSED OPPORTUNITIES WIDGET */}
        {missedOpportunities.length > 0 && (
          <div className="bg-gradient-to-br from-red-500/5 to-white/5 border border-red-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Target className="w-24 h-24 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Missed Opportunities
            </h3>
            <div className="space-y-4 relative z-10">
              {missedOpportunities.map(tx => (
                <div key={tx.id} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold">{tx.text.replace('Paid to ', '').split(' (')[0]}</h4>
                    <p className="text-white/40 text-xs">Recommended: {tx.recommended_card || "Better Card"}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-red-400 font-bold text-lg">- ₹{tx.missed_saving_amount || 0}</span>
                    <span className="text-red-400/50 text-[10px] uppercase tracking-wider">Lost Savings</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions Table */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif' }}>Recent Transactions</h3>
            <button className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Merchant</th>
                  <th className="px-8 py-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Category</th>
                  <th className="px-8 py-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Amount</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-white/20">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-white/20">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <span className="text-white/40 font-bold">{tx.text?.[0] || "?"}</span>
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{tx.text || "-"}</p>
                            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white/60 text-sm font-medium">{tx.category}</td>
                      <td className="px-8 py-6 text-white/60 text-sm font-medium uppercase">{tx.type}</td>
                      <td className={`px-8 py-6 font-bold text-sm ${tx.type === 'credited' ? 'text-green-400' : 'text-white'}`}>
                        {tx.type === 'credited' ? '+' : ''}{tx.amount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div className="mt-20 flex flex-col items-center justify-center text-white/20 text-xs py-10">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-bold tracking-widest uppercase">Verified by SpendWise System</span>
        </div>
      </div>
    </div >
  )
}
