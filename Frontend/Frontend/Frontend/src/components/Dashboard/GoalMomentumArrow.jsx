import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const GoalMomentumArrow = ({ netSavings = 0, goalAmount = 0, goalAchieved = false }) => {
    // Edge Case Protection: Hide if critical data is missing (undefined/null)
    if (netSavings === undefined || netSavings === null || !goalAmount) return null;

    // Financial Logic (Strict)
    let status = 'hidden';

    if (goalAchieved) {
        status = 'achieved';
    } else if (netSavings >= 0) {
        status = 'positive'; // Moving forward
    } else {
        status = 'negative'; // Spending exceeds earnings
    }

    // Config based on status
    const config = {
        achieved: {
            color: 'text-yellow-400',
            icon: Trophy,
            animation: { scale: 1.1 },
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } // Soft scale-in/out
        },
        positive: {
            color: 'text-emerald-600',
            animation: { x: 6 }, // Small forward motion
            transition: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            isArrow: true
        },
        negative: {
            color: 'text-red-500',
            animation: { x: -6 }, // Small backward motion
            transition: { duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            isArrow: true,
            rotate: 180 // Point left
        }
    };

    const activeConfig = config[status];
    if (!activeConfig) return null;

    return (
        <div className="flex-none mx-6 flex items-center justify-center">
            {activeConfig.isArrow ? (
                <motion.svg
                    width="36" // w-9
                    height="36" // h-9
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transform ${activeConfig.rotate ? 'rotate-180' : ''}`}
                    animate={activeConfig.animation}
                    transition={activeConfig.transition}
                >
                    <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={activeConfig.color}
                    />
                </motion.svg>
            ) : (
                <div className="relative flex flex-col items-center">
                    <motion.div
                        animate={activeConfig.animation}
                        transition={activeConfig.transition}
                        className="relative"
                    >
                        <activeConfig.icon className={`w-8 h-8 ${activeConfig.color}`} />
                    </motion.div>
                    <span className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-widest mt-1">Goal Achieved</span>
                </div>
            )}
        </div>
    );
};

export default GoalMomentumArrow;
