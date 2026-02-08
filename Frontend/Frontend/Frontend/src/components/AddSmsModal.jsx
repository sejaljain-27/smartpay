import React, { useState, useEffect } from "react";
import { X, MessageSquare, Info, Smartphone, CheckCircle2 } from "lucide-react";
import { ingestSMS } from "../services/api";

export default function AddSmsModal({ isOpen, onClose, onTransactionAdded }) {
  const [smsText, setSmsText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!smsText) return;
    setIsParsing(true);
    setError(""); // Clear previous errors
    try {
      await ingestSMS(smsText);
      setIsParsing(false);
      setIsSuccess(true);
      if (onTransactionAdded) onTransactionAdded();

      setTimeout(() => {
        setIsSuccess(false);
        setSmsText("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("SMS Parse Failed", err);
      setIsParsing(false);
      setError("Could not read amount/merchant from SMS. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif' }}>Add UPI Expense via SMS</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">

          {/* Info Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-100 font-bold mb-1">Web apps cannot read SMS automatically.</p>
              <p className="text-blue-300/80 font-medium">Paste a bank UPI SMS below to auto-add the expense and update your dashboard.</p>
            </div>
          </div>

          {/* SMS Input Area */}
          <div className="space-y-3">
            <label className="block text-white/60 text-xs font-bold uppercase tracking-widest ml-1">Bank SMS Message</label>
            <textarea
              autoFocus
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="₹1250 debited via UPI to Amazon on 22-Jan..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all resize-none font-medium leading-relaxed"
            />
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider ml-1 italic">
              Example: "Rs 850 debited from A/c XX1234 via UPI to Swiggy on 27-Jan-26"
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-3 animate-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <p className="text-red-300 text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            disabled={!smsText || isParsing || isSuccess}
            onClick={handleParse}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${isSuccess
              ? 'bg-green-500 text-white'
              : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-20'
              }`}
          >
            {isParsing ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Parsing SMS...</span>
              </span>
            ) : isSuccess ? (
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6" />
                <span>Expense Added Successfully</span>
              </span>
            ) : (
              <span>Parse SMS & Add Expense</span>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="p-8 pt-0 text-center">
          <div className="flex items-center justify-center space-x-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
            <Smartphone className="w-3.5 h-3.5" />
            <span>In production, this comes from an optional Android companion app</span>
          </div>
        </div>

      </div>
    </div>
  );
}
