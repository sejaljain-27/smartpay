
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SpendingBehavior = () => {
    const [data, setData] = useState([]);
    const [goalStatus, setGoalStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return; // Handle no token case
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [analyticsRes, goalsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/analytics/spending-behavior`, config),
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/analytics/goals-status`, config)
                ]);

                setData(analyticsRes.data);
                setGoalStatus(goalsRes.data);
            } catch (error) {
                console.error("Error fetching spending behavior:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generate last 30 days for the grid
    const generateGridData = () => {
        const grid = [];
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 29); // Last 30 days including today

        const dataMap = {};
        if (Array.isArray(data)) {
            data.forEach(d => {
                dataMap[d.date] = d;
            });
        }

        for (let d = new Date(pastDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const entry = dataMap[dateStr] || { net: 0, credits: 0, debits: 0, behavior: 'neutral' };
            grid.push({
                date: dateStr,
                ...entry,
                dayOfWeek: d.getDay()
            });
        }
        return grid;
    };

    const gridData = generateGridData();

    const getColorClass = (net) => {
        if (net === 0) return 'bg-white/10';
        if (net > 0) {
            if (net > 2000) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            if (net > 500) return 'bg-emerald-600';
            return 'bg-emerald-900/60 border border-emerald-500/30';
        } else {
            if (net < -2000) return 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]';
            if (net < -500) return 'bg-rose-700';
            return 'bg-rose-900/60 border border-rose-500/30';
        }
    };

    return (
        <div className="bg-gradient-to-br from-emerald-500/5 to-white/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between h-full min-h-[250px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-1">Spending Behavior</p>
                    <h3 className="text-2xl font-serif text-white leading-none">Last 30 Days</h3>
                </div>
                {goalStatus?.achieved && (
                    <span className="text-yellow-400 text-2xl animate-bounce" title="Goal Achieved!">🏆</span>
                )}
            </div>

            {/* Heatmap Grid - Squares */}
            <div className="w-full flex-1 flex items-center justify-center">
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(24px, 1fr))`,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-start', // Align left or center? User said "align them match with other divs"
                        gap: '8px'
                    }}
                >
                    {gridData.map((day, i) => (
                        <div
                            key={i}
                            className={`w-5 h-5 md:w-6 md:h-6 rounded-md ${getColorClass(day.net)} relative group transition-all duration-300 hover:scale-110 z-0 hover:z-10 cursor-pointer shadow-lg`}
                        >
                            {/* Trophy for excellent days */}
                            {day.net > 1000 && (
                                <div className="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-500/20 rounded-full p-0.5 border border-yellow-500/50">🏆</div>
                            )}

                            {/* Improved Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 min-w-[140px] bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-3 backdrop-blur-md pointer-events-none transform transition-all">
                                <div className="text-[10px] font-bold text-white/60 mb-2 border-b border-white/10 pb-1 flex justify-between">
                                    <span>{day.date}</span>
                                    <span>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-emerald-400 text-[10px]">
                                        <span>Credits</span>
                                        <span className="font-mono">+₹{day.credits}</span>
                                    </div>
                                    <div className="flex justify-between text-rose-400 text-[10px]">
                                        <span>Debits</span>
                                        <span className="font-mono">-₹{day.debits}</span>
                                    </div>
                                    <div className={`flex justify-between font-bold text-xs pt-1 border-t border-white/10 ${day.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        <span>Net</span>
                                        <span className="font-mono">{day.net > 0 ? '+' : ''}₹{day.net}</span>
                                    </div>
                                </div>

                                {day.behavior !== 'neutral' && (
                                    <div className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-center ${day.net > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                        {day.net > 1000 ? "🌟 Excellent" : day.net > 0 ? "✔ Healthy" : "⚠️ High Spend"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mini Legend */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[9px] text-white/30">
                <span className="uppercase tracking-wider">Activity</span>
                <div className="flex items-center gap-2">
                    <span className="text-[8px]">Spend</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-rose-700 rounded-sm"></div>
                        <div className="w-2 h-2 bg-white/10 rounded-sm"></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-sm"></div>
                    </div>
                    <span className="text-[8px]">Save</span>
                </div>
            </div>
        </div>
    );
};

export default SpendingBehavior;
