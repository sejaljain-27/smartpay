import React, { useState, useEffect } from "react"
import {
  Plus, CreditCard, TrendingUp, MoreHorizontal,
  CheckCircle2, Shield, ArrowUpRight, Wallet
} from "lucide-react"
import AddCardModal from "../components/AddCardModal"
import { getCards, getSavings } from "../services/api"

export default function CardsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cards, setCards] = useState([])
  const [globalSavings, setGlobalSavings] = useState(0)

  const fetchCards = async () => {
    try {
      const [cardsRes, savingsRes] = await Promise.all([
        getCards(),
        getSavings().catch(() => ({ totalSavings: 0 }))
      ])

      if (cardsRes.data.cards) {
        // Transform backend data to frontend model if necessary
        // Backend: { id, card_name, bank, card_type, last_digits, network, created_at, ... }
        // Frontend expects: { id, bank, type, number, ... } and some mock metrics logic
        const formattedCards = cardsRes.data.cards.map(c => ({
          id: c.id,
          bank: c.bank || c.card_name,
          type: c.card_type ? c.card_type.toUpperCase() : 'CARD',
          number: `**** ${c.last_digits || '****'}`,
          isTopPerformer: c.usage_rate > 20, // Example logic
          totalSaved: `₹${c.total_saved}`,
          usageRate: c.usage_rate,
          rawSaved: Number(c.total_saved), // Keep raw number for aggregation
          offers: [] // Mock or fetch if needed
        }))
        setCards(formattedCards)
      }

      setGlobalSavings(Number(savingsRes.totalSavings) || 0)

    } catch (err) {
      console.error("Failed to fetch cards data", err)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto py-12 px-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'serif' }}>My Cards</h1>
          <p className="text-white/60 text-lg font-medium">Manage your payment methods and track performance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Card</span>
        </button>
      </div>

      <AddCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCardAdded={fetchCards}
      />

      <div className="space-y-12">
        {/* Calc Stats */}
        {(() => {
          const totalSavedAll = globalSavings; // Use fetched global savings
          const mostUsed = cards.reduce((prev, current) => (prev.usageRate > current.usageRate) ? prev : current, { bank: "No Card", usageRate: 0 });

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
                <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em] mb-4">Total Cards</p>
                <div className="flex items-end space-x-3">
                  <h3 className="text-6xl font-serif text-white leading-none">{cards.length}</h3>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{cards.filter(c => c.type === 'CREDIT').length} credit / {cards.filter(c => c.type === 'DEBIT').length} debit</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
                <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em] mb-4">Total Saved</p>
                <div className="flex items-center space-x-3">
                  <h3 className="text-6xl font-serif text-white leading-none">₹{totalSavedAll}</h3>
                  <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/20 text-[10px] font-bold uppercase tracking-wider">
                    {totalSavedAll > 0 ? "SAVING BIG" : "START SAVING"}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Most Used Card</p>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{mostUsed.bank || "No Card"}</h3>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{mostUsed.usageRate}% usage rate</p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-white/20" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card List Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.length === 0 && (
            <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 border-dashed rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center justify-center space-y-4 opacity-50 h-[320px]">
              <CreditCard className="w-12 h-12 text-white/20" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">No cards added</p>
            </div>
          )}
          {cards.map((card) => (
            <div key={card.id} className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl relative group overflow-hidden">
              {/* Visual Flair */}
              <div className="absolute top-0 right-0 p-8">
                {card.isTopPerformer && (
                  <span className="bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">Top Performer</span>
                )}
              </div>

              <div className="flex flex-col h-full">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'serif' }}>{card.bank}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{card.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-white/60 text-xs font-medium tracking-widest">{card.number}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Saved</span>
                      <span className="text-xl font-serif text-white">{card.totalSaved}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[65%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Usage Rate</span>
                      <span className="text-xl font-serif text-white">{card.usageRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${card.usageRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Offers */}
                <div className="mt-auto">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Active Highlights</p>
                  <div className="flex flex-wrap gap-3">
                    {card.offers.map((offer, i) => (
                      <span key={i} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium">
                        {offer}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card Panel */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-4 group hover:border-white/20 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white/40 group-hover:text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">Add a New Card</h3>
              <p className="text-white/30 text-sm font-medium">Track performance and maximize savings with SmartPay</p>
            </div>
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-20 flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center space-x-3 text-white/20 text-xs">
          <Shield className="w-4 h-4" />
          <span className="font-bold tracking-widest uppercase">Bank-grade security encryption active</span>
        </div>
      </div>
    </div>
  )
}
