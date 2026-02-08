import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBestOffer, useOffer, addTransaction, getCards, getGoalProgress, sendChatMessage } from "../services/api";
import {
  Utensils,
  Plane,
  ShoppingBag,
  Tv,
  Zap,
  HeartPulse,
  GraduationCap,
  Globe,
  Smartphone,
  CreditCard,
  Info,
  Shield,
  CheckCircle2,
  Sparkles,
  Target,
  Mic,
  Volume2,
  Square
} from "lucide-react";
import { useVoice } from "../hooks/useVoice";

const categories = [
  { id: "dining", label: "Dining & Restaurants", icon: Utensils },
  { id: "travel", label: "Travel & Transport", icon: Plane },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "subscriptions", label: "OTT & Subscriptions", icon: Tv },
  { id: "utilities", label: "Utilities & Bills", icon: Zap },
  { id: "health", label: "Healthcare & Wellness", icon: HeartPulse },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "online", label: "Online Services", icon: Globe },
];

const categoryContexts = {
  dining: [
    { id: "walkin", label: "Restaurant Walk-in" },
    { id: "zomato", label: "Zomato Dining" },
    { id: "swiggy", label: "Swiggy Dineout" },
    { id: "eazydiner", label: "EazyDiner" },
    { id: "delivery", label: "Food Delivery" },
    { id: "general", label: "General Online" },
  ],
  travel: [
    { id: "flights", label: "Flight Bookings" },
    { id: "hotels", label: "Hotel Bookings" },
    { id: "uber", label: "Uber" },
    { id: "ola", label: "Ola" },
    { id: "train", label: "Train Tickets" },
    { id: "bus", label: "Bus Tickets" },
  ],
  shopping: [
    { id: "amazon", label: "Amazon" },
    { id: "flipkart", label: "Flipkart" },
    { id: "myntra", label: "Myntra" },
    { id: "grocery", label: "Online Grocery" },
    { id: "retail", label: "Retail Store" },
    { id: "supermarket", label: "Supermarket" },
  ],
  subscriptions: [
    { id: "netflix", label: "Netflix" },
    { id: "prime", label: "Amazon Prime" },
    { id: "disney", label: "Disney+ Hotstar" },
    { id: "spotify", label: "Spotify" },
    { id: "youtube", label: "YouTube Premium" },
    { id: "other_sub", label: "Other Subscriptions" },
  ],
  online: [
    { id: "ecommerce", label: "E-commerce Sites" },
    { id: "recharge", label: "Mobile Recharge" },
    { id: "insurance", label: "Insurance Payment" },
    { id: "transfer", label: "Online Transfer" },
  ],
  education: [
    { id: "fee", label: "Course Fees" },
    { id: "online_course", label: "Online Courses" },
    { id: "books", label: "Books & Materials" },
    { id: "coaching", label: "Coaching Classes" },
  ],
  health: [
    { id: "pharmacy", label: "Pharmacy" },
    { id: "hospital", label: "Hospital Bills" },
    { id: "gym", label: "Gym Membership" },
    { id: "health_check", label: "Health Checkup" },
  ],
  utilities: [
    { id: "electricity", label: "Electricity Bill" },
    { id: "water", label: "Water Bill" },
    { id: "gas", label: "Gas Bill" },
    { id: "broadband", label: "Broadband/WiFi" },
    { id: "dth", label: "DTH Recharge" },
  ],
};

const categoryMap = {
  "Dining & Restaurants": "Dining",
  "Food Delivery": "Food Delivery",
  "Utilities & Bills": "Bill Payment",
  "OTT & Subscriptions": "Entertainment",
  "Travel & Transport": "Travel",
  "Shopping": "Shopping",
  "Healthcare & Wellness": "Health",
  "Education": "Education",
  "Online Services": "Online"
};

export default function AboutToPayPage() {
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("dining");
  const [selectedContext, setSelectedContext] = useState(
    categoryContexts.dining[0].id,
  );
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offerResult, setOfferResult] = useState(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  // Cards for matching
  const [userCards, setUserCards] = useState([]);

  // Voice Hook
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, cancelSpeech, setTranscript } = useVoice();
  const [aiAdvice, setAiAdvice] = useState(null);

  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        const res = await getCards();
        if (res.data.cards) setUserCards(res.data.cards);
      } catch (e) {
        console.error("Failed to load cards for matching", e);
      }
    };
    fetchUserCards();
  }, []);

  // Reset context when category changes
  useEffect(() => {
    if (categoryContexts[selectedCategory]) {
      setSelectedContext(categoryContexts[selectedCategory][0].id);
    }
    setShowResult(false);
  }, [selectedCategory]);

  // Handle Voice Interaction for Pre-Pay Box
  useEffect(() => {
    const processVoiceQuery = async () => {
      if (!isListening && transcript) {
        try {
          // Optimistic UI update
          setAiAdvice(prev => ({ ...prev, message: "Thinking..." }));

          const contextMsg = `Context: User is paying ₹${amount} for ${selectedCategory}. User asked: "${transcript}". Answer briefly as a coach.`;
          const res = await sendChatMessage(contextMsg);

          setAiAdvice(prev => ({ ...prev, message: res.data.reply }));
          setTranscript(""); // Clear
        } catch (e) {
          setAiAdvice(prev => ({ ...prev, message: "I couldn't hear you clearly. Try again!" }));
        }
      }
    };

    if (transcript && !isListening) {
      processVoiceQuery();
    }
  }, [isListening, transcript]);

  const handleVoiceQuery = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const calculateEfficiency = (savings, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((savings / total) * 1000) / 10);
  };


  const handleCheckOffer = async () => {
    if (!amount || loading) return; // STRICT GUARD
    setLoading(true);
    setShowResult(false);
    setError("");
    setOfferResult(null);
    setAiAdvice(null); // Reset advice

    try {
      // map category
      const selectedLabel = categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      const mappedCategory = selectedLabel;

      const contextObj = currentContexts.find(c => c.id === selectedContext);
      let merchantName = contextObj?.label || selectedContext || null;

      if (selectedContext === "walkin" || merchantName === "Restaurant Walk-in") merchantName = "Food (All Merchants)";
      if (selectedCategory === "utilities") merchantName = "";

      const token = localStorage.getItem('token');

      // 1. GET OFFER (Deterministic)
      const offerRes = await getBestOffer({
        amount: Number(amount),
        category: mappedCategory,
        merchant: merchantName,
        paymentType: "card",
      });

      const data = offerRes.data;

      // 2. SET OFFER RESULT FIRST (Visual Feedback)
      if (data.hasOffer === true && data.bestOffer) {
        const offer = data.bestOffer;
        const efficiency = calculateEfficiency(offer.calculated_savings, amount);
        const discountMsg = offer.discount_type?.startsWith("Percentage")
          ? `${offer.discount_value}% discount on this card compared to others.`
          : `Flat ₹${offer.discount_value} off on this payment.`;

        setOfferResult({
          ...offer,
          efficiency_score: efficiency,
          description: discountMsg
        });
      } else {
        setOfferResult({
          isFallback: true,
          card_name: "Standard Payment",
          bank_name: "No Offer",
          calculated_savings: 0,
          description: "No specific offer found for this payment. You can still record it.",
          efficiency_score: 0
        });
      }

      // SHOW RESULT IMMEDIATELY (Don't wait for AI)
      setShowResult(true);

      // 3. CALL AI SEPARATELY (Progressive Loading)
      try {
        const adviceRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/chat/pre-pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: Number(amount), category: mappedCategory })
        }).then(res => res.json());

        if (adviceRes) setAiAdvice(adviceRes);
      } catch (aiErr) {
        console.error("AI Insight Failed (Silent Fallback)", aiErr);
        // No UI error for AI failure
      }

    } catch (err) {
      console.error(err);
      setOfferResult({
        isFallback: true,
        card_name: "Standard Payment",
        bank_name: "Error",
        calculated_savings: 0,
        description: "Could not fetch offers. Proceed with standard payment.",
        efficiency_score: 0
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const [userGoal, setUserGoal] = useState(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const goalRes = await getGoalProgress(monthStr);
        setUserGoal(goalRes.data);
      } catch (e) {
        console.log("No goal found or error fetching goal");
      }
    };
    fetchContext();
  }, []);

  const currentContexts = categoryContexts[selectedCategory] || [];

  const handleRecordPayment = async (ignored = false, decision = null) => {
    if (!offerResult) return;
    setLoading(true);
    try {
      if (offerResult.isFallback && !ignored) {
        // Standard transaction
        await addTransaction(
          Number(amount),
          `Paid at ${categoryContexts[selectedCategory]?.find(c => c.id === selectedContext)?.label || selectedContext} (${selectedCategory})`,
          // use mapped category or fallback to selectedCategory
          categoryMap[categories.find(c => c.id === selectedCategory)?.label] || selectedCategory
        );
      } else {
        // Use offer OR Ignore offer
        const merchantVal = !offerResult.merchant
          ? (categoryContexts[selectedCategory]?.find(c => c.id === selectedContext)?.label || selectedContext)
          : offerResult.merchant;

        // If ignored, we use the "Default" card or just "Standard Payment" text
        // If Verified, we use the "Best" card.

        let finalCardName = offerResult.card_name || offerResult.bank || "Payment";
        if (!ignored) {
          // Smart Card Matching Logic (Existing)
          const matchString = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "");
          const offerHints = [
            offerResult.card_name,
            offerResult.merchant,
            offerResult.payment_type,
            offerResult.bank
          ].map(matchString).filter(Boolean);

          const bestCard = userCards.find(c => {
            const cardName = matchString(c.card_name);
            const bankName = matchString(c.bank);
            return offerHints.some(hint => (cardName && cardName.includes(hint)) || (bankName && bankName.includes(hint)) || (hint && cardName && hint.includes(cardName)));
          });
          if (bestCard) finalCardName = bestCard.card_name;
        } else {
          // Ignored: User probably used a different card, but we dont ask which one yet.
          // We'll log it as "Ignored Offer"
          finalCardName = "Standard Payment";
        }

        await useOffer({
          amount: Number(amount),
          category: categoryMap[categories.find(c => c.id === selectedCategory)?.label] || selectedCategory,
          merchant: merchantVal || "Merchant",
          card_name: finalCardName,
          offer_id: offerResult.id,
          savings: ignored ? 0 : (offerResult.calculated_savings || 0),
          // NEW FIELDS
          ignored_offer: ignored,
          missed_saving_amount: ignored ? (offerResult.calculated_savings || 0) : 0,
          recommended_card: ignored ? (offerResult.card_name || "Best Card") : null,
          decision: decision // NEW: AI decision tracking
        });
      }

      if (decision === "ai_accepted") {
        setShowSuccess(true);
        setLoading(false);
        return; // STOP HERE - Do not navigate yet
      }

      navigate("/dashboard"); // Redirect to Dashboard as requested
    } catch (err) {
      console.error("Payment failed", err);
      setError(err.response?.data?.error || err.message || "Failed to record payment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="relative z-10 flex flex-col items-center py-20 px-6 max-w-7xl mx-auto">
      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-zinc-900/90 p-12 rounded-[2rem] border border-white/10 text-center max-w-lg shadow-2xl relative transform animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
              <Shield className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-serif">Savings Secured</h2>
            <p className="text-white/60 text-base mb-8 leading-relaxed">
              Recommendation applied. You have avoided an unnecessary expense and optimized your goal progress.
              <br /><br />
              <span className="font-bold text-emerald-400 text-xl block mt-2">
                ₹{amount} Saved
              </span>
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-12 py-4 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-16 w-full">
        <div className="inline-flex items-center space-x-2 text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">
          <Shield className="w-4 h-4" />
          <span>Transaction Analyst</span>
        </div>
        <h1
          className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
          style={{ fontFamily: "serif" }}
        >
          About to pay
        </h1>
      </div>

      {/* Workspace */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Amount Input */}
          <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="w-24 h-24 text-white" />
            </div>
            <label className="block text-white/50 text-sm font-bold uppercase tracking-widest mb-8 ml-1">
              Transaction Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-0 text-6xl text-white/30 font-serif">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent border-none text-7xl md:text-8xl text-white placeholder:text-white/5 focus:ring-0 p-0 pl-16 transition-all font-serif"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-white/50 text-sm font-bold uppercase tracking-widest mb-8 ml-1">
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center group ${selectedCategory === cat.id
                    ? "bg-white text-black border-white shadow-xl"
                    : "bg-white/5 border-white/10 hover:border-white/20 backdrop-blur-sm"
                    }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${selectedCategory === cat.id
                      ? "bg-black/10"
                      : "bg-white/5 group-hover:bg-white/10"
                      }`}
                  >
                    <cat.icon
                      className={`w-7 h-7 ${selectedCategory === cat.id ? "text-black" : "text-white/60"}`}
                    />
                  </div>
                  <span
                    className={`text-[13px] font-bold tracking-tight px-1 ${selectedCategory === cat.id ? "text-black" : "text-white/60"}`}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 space-y-8">
          {/* Context Selection - DYNAMIC */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl min-h-[400px]">
            <label className="block text-white/50 text-sm font-bold uppercase tracking-widest mb-6 ml-1">
              Verify Merchant
            </label>
            <div className="space-y-3">
              {currentContexts.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => setSelectedContext(ctx.id)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${selectedContext === ctx.id
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/5 hover:border-white/10"
                    }`}
                >
                  <span
                    className={`text-base ${selectedContext === ctx.id ? "text-white font-bold" : "text-white/50 font-medium"}`}
                  >
                    {ctx.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selectedContext === ctx.id
                      ? "bg-white border-white"
                      : "bg-transparent border-white/10"
                      }`}
                  >
                    {selectedContext === ctx.id && (
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    )}
                  </div>
                </button>
              ))}
              {currentContexts.length === 0 && (
                <p className="text-white/20 text-xs text-center py-8">
                  Select a category to see options
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            disabled={!amount || loading}
            onClick={handleCheckOffer}
            className="w-full py-6 rounded-[2rem] bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-xl shadow-black/20 group overflow-hidden relative"
          >
            <span className="relative z-10">
              {loading ? "Analyzing..." : "Check Offer"}
            </span>
          </button>

          <button
            onClick={() => navigate("/chat")}
            className="w-full py-4 rounded-[2rem] bg-white/5 text-white/40 font-medium text-sm hover:bg-white/10 transition-all flex items-center justify-center space-x-2 border border-white/5 hover:border-white/10 group/ai"
          >
            <Sparkles className="w-4 h-4 text-white/30 group-hover/ai:text-white/60 transition-colors" />
            <span className="group-hover/ai:text-white/80 transition-colors">Consult Financial Analyst</span>
          </button>
        </div>
      </div>

      {/* Results Engine */}
      {showResult && !loading && (
        <div className="mt-20 w-full animate-in fade-in slide-in-from-bottom-12 duration-700">
          <div className="bg-white/[0.08] p-12 rounded-[3.5rem] border border-white/20 backdrop-blur-2xl relative overflow-hidden group">
            {/* Visual Flair */}
            <div className="absolute top-0 right-0 p-12">
            </div>

            {error ? (
              <div className="text-center text-red-400 text-lg font-bold py-12">
                {error}
              </div>
            ) : offerResult ? (
              <div className="flex flex-col gap-12">
                {/* Changed to flex-col and added gap */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="w-28 h-28 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5">
                    <CreditCard className="w-12 h-12 text-white/20" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] mb-4">
                      Optimal Payment Method
                    </h4>
                    <h2
                      className="text-5xl md:text-6xl font-bold text-white mb-6"
                      style={{ fontFamily: "serif" }}
                    >
                      {offerResult.card_name || offerResult.payment_type || offerResult.merchant || "Standard Payment"}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-10 mb-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">
                          Est. Savings
                        </span>
                        <span className="text-6xl md:text-7xl font-serif text-emerald-500">
                          ₹{offerResult.calculated_savings || 0}
                        </span>
                      </div>
                      <div className="w-px h-14 bg-white/10 hidden md:block" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">
                          Issuer
                        </span>
                        <span className="text-xl md:text-2xl font-bold text-white/80">
                          {offerResult.bank || offerResult.bank_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* GOAL IMPACT SECTION */}
                    {userGoal && offerResult.calculated_savings > 0 && (
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 flex items-center space-x-3">
                        <Target className="w-5 h-5 text-emerald-500/50 shrink-0" />
                        <div>
                          <h5 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Goal Contribution</h5>
                          <p className="text-white/80 text-sm font-medium">
                            <span className="text-emerald-500 font-bold"> +{((offerResult.calculated_savings / userGoal.target) * 100).toFixed(1)}%</span> progress towards monthly target.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* BENEFIT BULLETS */}
                    <div className="space-y-3 mb-8">
                      {offerResult.discount_percentage > 0 && (
                        <div className="flex items-center space-x-3 text-white/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span><span className="font-bold text-white/90">{offerResult.discount_percentage}% cashback</span> applied.</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-3 text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Highest return on spend.</span>
                      </div>
                      {offerResult.max_discount && (
                        <div className="flex items-center space-x-3 text-white/60">
                          <Info className="w-4 h-4 text-white/30" />
                          <span>Cap: ₹{offerResult.max_discount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 p-10 rounded-[3rem] text-center border border-white/10 min-w-[200px]">
                    <div className="text-6xl font-serif text-white mb-2">
                      {offerResult.efficiency_score || "0.0"}
                    </div>
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest leading-tight">
                      Efficiency
                      <br />
                      Rating
                    </div>
                  </div>
                </div>

                {/* AI PRE-PAY INTERVENTION (Integrated) */}
                {aiAdvice && (
                  <div className="mb-6 mt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white/5 border border-amber-500/20 p-6 rounded-2xl relative overflow-hidden group/ai-box">

                      {/* Voice Controls for AI Box */}
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <button
                          onClick={() => isSpeaking ? cancelSpeech() : speak(aiAdvice.message)}
                          className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                          title="Read Aloud"
                        >
                          {isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-start gap-5">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <Info className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 pr-8">
                          <h4 className="text-amber-500/80 font-bold text-xs uppercase tracking-wider mb-2">Analyst Insight</h4>
                          {aiAdvice.structured_insight ? (
                            <div className="space-y-4 mb-5">
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Context</h5>
                                <p className="text-white/80 text-sm">{aiAdvice.structured_insight.context}</p>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <h5 className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-1">Trade-off</h5>
                                <p className="text-white/80 text-sm">{aiAdvice.structured_insight.tradeoff}</p>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <h5 className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-1">Impact</h5>
                                <p className="text-white/80 text-sm">{aiAdvice.structured_insight.impact}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-white/90 text-sm font-medium leading-relaxed mb-5 font-serif">
                              "{aiAdvice.message}"
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 mb-4">
                            <button
                              onClick={() => handleRecordPayment(false, "ai_accepted")}
                              className="px-5 py-2.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all border border-transparent"
                            >
                              <span>Follow Recommendation</span>
                            </button>
                            <button
                              onClick={() => handleRecordPayment(false, "ai_ignored")}
                              className="px-5 py-2.5 rounded-lg bg-transparent text-white/40 font-medium text-xs hover:bg-white/5 hover:text-white transition-all border border-white/10"
                            >
                              Proceed Anyway
                            </button>
                          </div>

                          {/* Voice Interaction Mic */}
                          <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                            <button
                              onClick={handleVoiceQuery}
                              className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'bg-transparent text-white/30 hover:bg-white/5 hover:text-white'}`}
                            >
                              {isListening ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                              <span>{isListening ? "Listening..." : "Ask Analyst"}</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS: Verified Pay & Ignore */}
                <div className="flex justify-center mt-8 gap-4">
                  <button
                    onClick={() => handleRecordPayment(false)}
                    className="px-12 py-5 rounded-[2rem] bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/20 flex items-center space-x-3 group"
                  >
                    <span>Confirm Payment</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleRecordPayment(true)}
                    className="px-8 py-5 rounded-[2rem] bg-white/5 text-white/60 font-medium text-lg hover:bg-white/10 hover:text-white transition-all border border-white/10"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )
      }

      {/* Note */}
      <div className="mt-24 text-center space-y-6">
        <div className="flex items-center justify-center space-x-3 text-white/20 text-xs">
          <Shield className="w-4 h-4" />
          <span className="font-medium tracking-wide">
            SpendWise provides insights only. No payment data is processed.
          </span>
        </div>
        <div className="w-px h-16 bg-gradient-to-b from-white/10 to-transparent mx-auto" />
      </div>
    </div >
  );
}
