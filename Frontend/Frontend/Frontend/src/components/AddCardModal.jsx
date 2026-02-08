import React, { useState, useEffect } from "react"
import { X, CreditCard, Shield, CheckCircle2 } from "lucide-react"

import { addCard } from "../services/api"

export default function AddCardModal({ isOpen, onClose, onCardAdded }) {
  const [formData, setFormData] = useState({
    type: "",
    bank: "",
    name: "",
    digits: "",
    network: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  if (!isOpen) return null

  const isFormValid = Object.values(formData).every(val => val.trim() !== "") && formData.digits.length === 4

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsSaving(true)
    try {
      await addCard({
        ...formData,
        card_name: formData.name, // Mapping to backend field
        card_type: formData.type, // Mapping to backend field
        last_digits: formData.digits
      })

      setIsSaving(false)
      setIsSuccess(true)
      if (onCardAdded) onCardAdded()
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({ type: "", bank: "", name: "", digits: "", network: "" })
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Failed to add card", err)
      setIsSaving(false)
      // Ideally show error toast
    }
  }

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all font-medium"
  const labelClasses = "block text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif' }}>Add New Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-8 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Card Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={inputClasses}
              >
                <option value="" disabled className="bg-zinc-900">Select Type</option>
                <option value="credit" className="bg-zinc-900">Credit Card</option>
                <option value="debit" className="bg-zinc-900">Debit Card</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Card Network</label>
              <select
                value={formData.network}
                onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                className={inputClasses}
              >
                <option value="" disabled className="bg-zinc-900">Select Network</option>
                <option value="visa" className="bg-zinc-900">Visa</option>
                <option value="mastercard" className="bg-zinc-900">Mastercard</option>
                <option value="rupay" className="bg-zinc-900">RuPay</option>
                <option value="amex" className="bg-zinc-900">Amex</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Bank Name</label>
            <input
              type="text"
              placeholder="Enter bank name (e.g. HDFC)"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Card Name</label>
            <input
              type="text"
              placeholder="Enter card name (e.g. Infinia)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Last 4 Digits</label>
            <input
              type="text"
              maxLength="4"
              placeholder="XXXX"
              value={formData.digits}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setFormData({ ...formData, digits: val })
              }}
              className={`${inputClasses} tracking-[0.5em] font-serif text-lg`}
            />
          </div>

          {/* Identification Note */}
          <div className="flex items-start space-x-2 text-white/30 text-[10px] font-bold uppercase tracking-wider px-1">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Only the last 4 digits are stored for identification.</span>
          </div>

          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSaving || isSuccess}
              className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${isSuccess
                ? 'bg-green-500 text-white'
                : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-20'
                }`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span>Save Card</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
