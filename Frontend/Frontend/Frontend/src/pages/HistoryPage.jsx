// Verified Fix
import React, { useState, useEffect } from "react"
import {
  Search, Filter, Calendar, CreditCard,
  ArrowUpRight, Wallet, History as HistoryIcon,
  SearchX, ChevronDown, CheckCircle2
} from "lucide-react"
import { getTransactions, getDashboardData, getSavings } from "../services/api" // Import API

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPayment, setSelectedPayment] = useState("All")

  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ totalExpense: 0, totalSavings: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const [txRes, dashRes, saveRes] = await Promise.all([
          getTransactions(),
          getDashboardData(),
          getSavings()
        ])
        setTransactions(txRes.data)
        setStats({
          totalExpense: dashRes.totalExpense,
          totalSavings: saveRes.totalSavings
        })
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.text || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || tx.category === selectedCategory
    const matchesPayment = selectedPayment === "All" || tx.type === selectedPayment // type used for now
    return matchesSearch && matchesCategory && matchesPayment
  })

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto py-12 px-6">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>History</h1>
        <p className="text-white/60 text-lg font-medium">View and analyze your past transactions and savings</p>
      </div>

      {/* Summary Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center space-x-3 text-white/40 text-sm font-bold uppercase tracking-widest mb-4">
            <Wallet className="w-4 h-4" />
            <span>Total Spent</span>
          </div>
          <h3 className="text-6xl font-serif text-white leading-none mb-2">₹{stats.totalExpense}</h3>
          <p className="text-white/30 text-xs font-medium mt-1">Total expenses</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center space-x-3 text-white/40 text-sm font-bold uppercase tracking-widest mb-4">
            <ArrowUpRight className="w-4 h-4 text-green-400" />
            <span>Total Savings</span>
          </div>
          <h3 className="text-6xl font-serif text-white leading-none mb-2">₹{stats.totalSavings}</h3>
          <p className="text-white/30 text-xs font-bold mt-1">Current balance</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center space-x-3 text-white/40 text-sm font-bold uppercase tracking-widest mb-4">
            <HistoryIcon className="w-4 h-4 text-blue-400" />
            <span>Transactions</span>
          </div>
          <h3 className="text-6xl font-serif text-white leading-none mb-2">{transactions.length}</h3>
          <p className="text-white/30 text-xs font-medium mt-1">Total records</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2rem] p-4 mb-8 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-medium text-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="min-w-[160px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-bold text-xs uppercase tracking-widest appearance-none"
            >
              <option value="All" className="bg-zinc-900">All Categories</option>
              <option value="Dining" className="bg-zinc-900">Dining</option>
              <option value="Shopping" className="bg-zinc-900">Shopping</option>
              <option value="Travel" className="bg-zinc-900">Travel</option>
              <option value="Grocery" className="bg-zinc-900">Grocery</option>
              <option value="Utilities" className="bg-zinc-900">Utilities</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div className="min-w-[160px]">
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-bold text-xs uppercase tracking-widest appearance-none"
            >
              <option value="All" className="bg-zinc-900">All Payments</option>
              <option value="Credit Card" className="bg-zinc-900">Credit Card</option>
              <option value="Debit Card" className="bg-zinc-900">Debit Card</option>
              <option value="UPI" className="bg-zinc-900">UPI</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="min-w-[180px] bg-white text-black rounded-xl px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-200 transition-all">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Last 30 Days</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Merchant</th>
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Card / Method</th>
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Savings</th>
                <th className="px-8 py-5 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 group-hover:border-zinc-300 transition-colors">
                        <span className="text-zinc-500 font-bold">{tx.text?.[0] || "?"}</span>
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold text-sm">{tx.text || "Unknown"}</p>
                        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-zinc-600 text-sm font-medium">{tx.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-base font-bold font-serif ${tx.type === 'credited' ? 'text-green-600' : 'text-zinc-900'}`}>
                      {tx.type === 'credited' ? '+' : ''}{tx.amount}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-300" />
                      <span className="text-zinc-600 text-sm font-medium uppercase">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-green-600 font-bold text-sm">--</span>
                      {/* Savings logic can be added if backend returns it */}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                      <SearchX className="w-12 h-12 text-zinc-200" />
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-20 flex flex-col items-center justify-center space-y-6 text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
        <div className="w-px h-12 bg-gradient-to-b from-white/10 to-transparent" />
        <p>© 2026 SpendWise History Engine</p>
      </div>
    </div>
  )
}
