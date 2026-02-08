
import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const CategoryGoalsWidget = ({ categoryData }) => {
    const [goals, setGoals] = useState([]);
    const [openAdvice, setOpenAdvice] = useState(null);

    // AI Advice Database (Frontend Logic)
    const getAIAdvice = (category, spent, limit) => {
        const percentage = (spent / limit) * 100;
        const remaining = limit - spent;

        const advices = {
            "Food": [
                "Try meal prepping on Sundays to save ~₹500/week.",
                "Limit dining out to once a week.",
                "Use grocery offers or cashback apps.",
                "Switch to generic brands for staples."
            ],
            "Travel": [
                "Carpool or use public transport twice a week.",
                "Book tickets in advance for better rates.",
                "Check for fuel credit card offers.",
                "Walk for short distances instead of cabs."
            ],
            "Shopping": [
                "Implement the 30-day rule for non-essentials.",
                "Unsubscribe from marketing emails.",
                "Compare prices online before buying offline.",
                "Wait for seasonal sales."
            ],
            "Entertainment": [
                "Switch to family plans for subscriptions.",
                "Look for free local events.",
                "Limit movie outings to once a month.",
                "Host game nights at home instead of going out."
            ],
            "Utilities": [
                "Unplug electronics when not in use.",
                "Switch to LED bulbs.",
                "Fix leaking taps immediately.",
                "Use washing machine only with full loads."
            ],
            "Health": [
                "Look for generic medicine alternatives.",
                "Utilize free health checkups if available.",
                "Preventive care is cheaper than cure.",
                "Exercise outdoors instead of a gym membership."
            ]
        };

        const categoryKey = Object.keys(advices).find(k => category.toLowerCase().includes(k.toLowerCase())) || "General";
        const specificAdvice = advices[categoryKey] || [
            "Review your recent transactions.",
            "Cut down on discretionary spending.",
            "Set a daily spending limit.",
            "Track every expense manually."
        ];

        // Deterministic selection based on day of month to keep it stable but rotating
        const day = new Date().getDate();
        const adviceIndex = day % specificAdvice.length;

        return specificAdvice[adviceIndex];
    };

    useEffect(() => {
        // Load goals from local storage
        const savedGoals = localStorage.getItem('smartPay_categoryGoals');
        if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
        }
    }, []);

    // Merge goals with real spending data
    const mergedGoals = goals.map(goal => {
        // Find matching category in API data (case insensitive partial match)
        const spending = categoryData.find(c =>
            c.category.toLowerCase().includes(goal.category.toLowerCase()) ||
            goal.category.toLowerCase().includes(c.category.toLowerCase())
        );

        const spent = spending ? Math.abs(Number(spending.total)) : 0;
        const percentage = Math.min((spent / goal.limit) * 100, 100);

        return {
            ...goal,
            spent,
            percentage,
            status: percentage >= 90 ? 'critical' : percentage >= 70 ? 'warning' : 'safe'
        };
    });

    if (mergedGoals.length === 0) return null; // Don't show if no goals set

    return (
        <div className="bg-gradient-to-br from-indigo-500/5 to-white/5 border border-indigo-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                    <Target className="w-5 h-5 text-indigo-400" />
                    Category Budgets
                </h3>
            </div>

            <div className="space-y-6">
                {mergedGoals.map((goal, idx) => (
                    <div key={idx} className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-white font-bold text-lg">{goal.category}</h4>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                                    ₹{goal.spent} / ₹{goal.limit}
                                </p>
                            </div>
                            {goal.status === 'critical' && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-full border border-red-500/20">Exceeded</span>}
                            {goal.status === 'warning' && <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20">Near Limit</span>}
                            {goal.status === 'safe' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">On Track</span>}
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-4">
                            <div
                                className={`h-full transition-all duration-1000 ${goal.status === 'critical' ? 'bg-red-500' :
                                        goal.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${goal.percentage}%` }}
                            />
                        </div>

                        {/* Interactive AI Advice */}
                        {(goal.status === 'warning' || goal.status === 'critical') && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setOpenAdvice(openAdvice === idx ? null : idx)}
                                    className="w-full flex items-center justify-between text-indigo-300 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-xl transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Lightbulb className="w-3 h-3" />
                                        How can I achieve this?
                                    </span>
                                    {openAdvice === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                {openAdvice === idx && (
                                    <div className="mt-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-100/80 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
                                        <p className="mb-1 font-bold text-indigo-300">💡 AI Suggestion:</p>
                                        {getAIAdvice(goal.category, goal.spent, goal.limit)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryGoalsWidget;
