import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Target, PieChart, CheckCircle2, TrendingUp, ShoppingBag, Utensils, Plane, Tv, Zap, Heart, GraduationCap, Globe } from "lucide-react"
import { createGoal, createCategoryGoal } from "../services/api"

export default function GoalsPage() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState("fixed")
  const [targetAmount, setTargetAmount] = useState("0")
  const [months, setMonths] = useState(1)
  const [unit, setUnit] = useState("months")
  const [isSuccess, setIsSuccess] = useState(false)

  // Category Goal State
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categoryLimit, setCategoryLimit] = useState("")
  const [catSaveSuccess, setCatSaveSuccess] = useState(false)

  // Standard Categories
  const categories = [
    { id: "Food", label: "Food & Dining", icon: Utensils },
    { id: "Travel", label: "Travel & Transport", icon: Plane },
    { id: "Shopping", label: "Shopping", icon: ShoppingBag },
    { id: "Entertainment", label: "Entertainment", icon: Tv },
    { id: "Utilities", label: "Utilities & Bills", icon: Zap },
    { id: "Health", label: "Health & Wellness", icon: Heart },
    { id: "Education", label: "Education", icon: GraduationCap },
    { id: "Others", label: "Others", icon: Globe },
  ]

  // Strict 2-Card Layout
  const goalTypes = [
    { id: "fixed", label: "Save a fixed amount", desc: "Set a target savings amount and timeline", icon: Target },
    { id: "category", label: "Category-wise Goal", desc: "Set a spending limit for one specific category", icon: PieChart }
  ]

  const totalMonths = unit === "years" ? months * 12 : months
  const monthlySavings = targetAmount && !isNaN(targetAmount)
    ? (parseFloat(targetAmount) / totalMonths).toFixed(0)
    : 0

  const handleSave = async () => {
    if (selectedType === 'fixed') {
      if (!targetAmount || targetAmount <= 0) return

      const monthlyAmt = parseFloat(monthlySavings)
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      try {
        await createGoal({ target_amount: monthlyAmt, month: monthStr })
        setIsSuccess(true)
        setTimeout(() => { setIsSuccess(false); navigate("/dashboard") }, 1500)
      } catch (err) {
        console.error("Failed to save goal", err)
      }
    } else {
      // Category Goal Save (Backend)
      if (!selectedCategory || !categoryLimit) return;

      try {
        await createCategoryGoal({ category: selectedCategory, limit_amount: parseFloat(categoryLimit) });
        setCatSaveSuccess(true);
        setTimeout(() => { setCatSaveSuccess(false); navigate("/dashboard") }, 1500)
      } catch (err) {
        console.error("Failed to save category goal", err);
      }
    }
  }

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto py-20 px-6">

      {/* Header */}
      <div className="text-center mb-16">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'serif' }}>Set your savings goal</h1>
        <p className="text-white/60 text-lg font-medium">Optional – helps SmartPay guide your spending decisions</p>
      </div>

      <div className="space-y-12">

        {/* Goal Type Selection - STRICT 2 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {goalTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${selectedType === type.id
                ? 'bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/20'
                : 'bg-gradient-to-br from-emerald-500/5 to-white/5 border-emerald-500/20 hover:border-emerald-500/40'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${selectedType === type.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                <type.icon className={`w-6 h-6 ${selectedType === type.id ? 'text-white' : 'text-white/60'}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${selectedType === type.id ? 'text-white' : 'text-white'}`}>{type.label}</h4>
              <p className={`text-xs font-medium leading-relaxed ${selectedType === type.id ? 'text-white/80' : 'text-white/40'}`}>{type.desc}</p>
              {selectedType === type.id && (
                <div className="absolute top-4 right-4 text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* CONDITIONAL RENDERING BASED ON SELECTION */}
        {selectedType === 'fixed' ? (
          <>
            {/* Amount Input */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[3rem] p-10 backdrop-blur-xl">
              <label className="block text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 ml-1">Target savings amount</label>
              <div className="relative flex items-center">
                <span className="absolute left-0 text-6xl text-white/20 font-serif">₹</span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-none text-7xl md:text-8xl text-white placeholder:text-white/5 focus:ring-0 p-0 pl-16 transition-all font-serif"
                />
              </div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-8 ml-1">How much do you want to save?</p>
            </div>

            {/* Time Period Input */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[3rem] p-10 backdrop-blur-xl">
              <div className="flex justify-between items-end mb-10">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Time period</label>
                <div className="text-right">
                  <span className="text-4xl font-serif text-white">{months}</span>
                  <span className="text-white/30 text-xs font-bold uppercase tracking-widest ml-2">{unit === 'months' ? 'Months' : 'Years'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  value={months}
                  onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-white/10 border-none rounded-2xl py-4 px-6 text-white placeholder-white/20 text-xl font-bold focus:ring-2 focus:ring-white/20 outline-none transition-all"
                />

                <div className="flex bg-white/10 rounded-2xl p-1">
                  <button onClick={() => setUnit('months')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${unit === 'months' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Months</button>
                  <button onClick={() => setUnit('years')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${unit === 'years' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Years</button>
                </div>
              </div>

              <div className="mt-6 ml-1">
                <p className="text-white/30 text-[10px] uppercase tracking-widest">Total duration: {totalMonths} Months</p>
              </div>
            </div>

            {/* Goal Summary */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp className="w-32 h-32 text-white" /></div>
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Your goal summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                <div><p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Total Target</p><p className="text-6xl font-serif text-white leading-none">₹{targetAmount || '0'}</p></div>
                <div><p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Timeline</p><p className="text-6xl font-serif text-white leading-none mb-1">{months} {unit === 'months' ? 'Months' : 'Years'}</p></div>
                <div><p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Monthly Target</p><p className="text-6xl font-serif text-white leading-none">₹{monthlySavings}<span className="text-xs text-white/30 font-serif ml-1">/mo</span></p></div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Category Grid Selection */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[3rem] p-10 backdrop-blur-xl">
              <label className="block text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 ml-1">Select Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-3 ${selectedCategory === cat.id
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-zinc-900 border-white/5 hover:border-white/20 text-white/60 hover:text-white'
                      }`}
                  >
                    <cat.icon className="w-6 h-6" />
                    <span className="text-xs font-bold text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-8 ml-1">Which expense do you want to control?</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[3rem] p-10 backdrop-blur-xl">
              <label className="block text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 ml-1">Monthly Spending Limit</label>
              <div className="relative flex items-center">
                <span className="absolute left-0 text-6xl text-white/20 font-serif">₹</span>
                <input
                  type="number"
                  value={categoryLimit}
                  onChange={(e) => setCategoryLimit(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent border-none text-7xl md:text-8xl text-white placeholder:text-white/5 focus:ring-0 p-0 pl-16 transition-all font-serif"
                />
              </div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-8 ml-1">Set your maximum monthly budget</p>
            </div>
          </>
        )}

      </div>

      {/* Action Button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={selectedType === 'fixed' ? (!targetAmount || isSuccess) : (!selectedCategory || !categoryLimit || catSaveSuccess)}
          className={`w-full py-6 rounded-[2rem] font-bold text-xl transition-all shadow-xl shadow-white/5 flex items-center justify-center space-x-3 ${(isSuccess || catSaveSuccess)
            ? 'bg-green-500 text-white'
            : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-20 translate-y-0 active:translate-y-1'
            }`}
        >
          {(isSuccess || catSaveSuccess) ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              <span>Goal Saved Successfully</span>
            </>
          ) : (
            <span>Save Goal</span>
          )}
        </button>
      </div>

    </div>
  )
}
