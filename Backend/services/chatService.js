import pool from "../db.js";
import { calculateSmartScore } from "./smartScore.js";
import { findBestOfferWaterfall } from "./offerService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

// Supported, fast Gemini models with automatic fallback
const CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest"
];

async function generateWithGemini(prompt, isJson = false) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in Backend/.env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
        try {
            const config = isJson ? { responseMimeType: "application/json" } : undefined;
            const model = genAI.getGenerativeModel({ model: modelName, generationConfig: config });
            const result = await model.generateContent(prompt);
            const text = result?.response?.text();
            if (text) return text;
        } catch (err) {
            console.warn(`[GEMINI] Model ${modelName} warning:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("All Gemini models failed to respond");
}

// 2. STRICT RATE LIMITING & LOCKING
// Map<userId, timestamp>
const userLastRequest = new Map();
// Simple in-memory lock to prevent parallel processing for the same user
const userProcessingLock = new Set();

// Helper to get formatted financial context for LLM
async function getFinancialContext(userId) {
    try {
        const scoreData = await calculateSmartScore(userId);
        const currentMonth = new Date().toISOString().slice(0, 7);

        // 1. Goals
        const goalRes = await pool.query(
            "SELECT target_amount FROM goals WHERE user_id = $1 AND month = $2",
            [userId, currentMonth]
        );

        // 2. Total Spend
        const spendRes = await pool.query(
            "SELECT ABS(SUM(amount)) as total FROM transactions WHERE user_id = $1 AND type = 'debited' AND TO_CHAR(created_at, 'YYYY-MM') = $2",
            [userId, currentMonth]
        );

        // 3. Top Categories (NEW)
        const catRes = await pool.query(
            `SELECT category, ABS(SUM(amount)) as total 
             FROM transactions 
             WHERE user_id = $1 AND type = 'debited' AND TO_CHAR(created_at, 'YYYY-MM') = $2 
             GROUP BY category 
             ORDER BY total DESC 
             LIMIT 3`,
            [userId, currentMonth]
        );

        const totalSpent = spendRes.rows[0].total ? Number(spendRes.rows[0].total) : 0;
        const goalTarget = goalRes.rows[0]?.target_amount ? Number(goalRes.rows[0].target_amount) : 0;

        // Format Categories
        const topCategories = catRes.rows.map(r => `${r.category}: ₹${r.total}`).join(", ");

        // Calculate Progress
        let goalStatus = "No Goal Set";
        let goalPercent = 0;

        if (goalTarget > 0) {
            goalPercent = ((totalSpent / goalTarget) * 100).toFixed(1);
            goalStatus = totalSpent > goalTarget ? "Exceeded" : "On Track";
        }

        return {
            smartScore: scoreData.smartScore,
            totalSpent,
            goalTarget,
            goalStatus,
            goalPercent,
            topCategories: topCategories || "None"
        };
    } catch (e) {
        console.error("Context Error:", e);
        return {};
    }
}

export const processChatMessage = async (userId, message) => {
    // 0. STRICT SINGLE CALL ENFORCEMENT
    if (userProcessingLock.has(userId)) {
        console.warn(`[GEMINI_BLOCK] Blocked parallel request for user ${userId}`);
        return "I'm thinking! Please wait a moment... ⏳";
    }

    // 0.1 RATE LIMITING CHECK
    const now = Date.now();
    const lastTime = userLastRequest.get(userId) || 0;
    const cooldownMs = 2000; // 2 seconds strict cooldown

    if (now - lastTime < cooldownMs) {
        return "Thinking... Please wait a moment! ⏳";
    }

    // ACQUIRE LOCK
    userProcessingLock.add(userId);
    userLastRequest.set(userId, now);

    console.log(`[GEMINI_CALL] Triggered by User: ${userId} | Message: "${message.substring(0, 20)}..."`);

    try {
        // --- 1. DETERMINISTIC ROUTING / COMMANDS CAN GO HERE ---
        // (Skipping for now to focus on LLM, but you can add keyword checks here)

        // Contextualize with real financial data
        const finContext = await getFinancialContext(userId);

        const systemPrompt = `
          You are a Wise & Action-Oriented AI Financial Coach. 
          Your name is "SmartPay Coach".

          USER CONTEXT (REAL DATA):
          - Smart Score: ${finContext.smartScore || "N/A"}/100
          - Monthly Goal: ₹${finContext.goalTarget || 0}
          - Current Spend: ₹${finContext.totalSpent || 0}
          - Goal Progress: ${finContext.goalPercent}% used
          - Budget Status: ${finContext.goalStatus}
          - Top Spending Categories: ${finContext.topCategories}

          STRICT TONE RULES (Based on Status):
          1. ON TRACK: Supportive, confident. "You are doing great!", "Keep it up!".
          2. OFF TRACK: Cautionary, advisory. "Watch your spending.", "Let's get back on track."

          COACHING RULES:
          1. USE THE DATA: Always mention specific numbers from the context (e.g., "You've spent ₹X on Dining").
          2. BE PROACTIVE: If score is low, suggest 1 specific fix.
          3. TONE: Encouraging.
          4. IF INFO MISSING: Ask the user to set a goal or add a card.
          
          USER MESSAGE: ${message}
        `;

        // CALL GEMINI WITH MULTI-MODEL FALLBACK
        const responseText = await generateWithGemini(systemPrompt, false);
        return responseText;

    } catch (error) {
        console.error("[GEMINI_ERROR] Failed:", error.message);
        try {
            const finContext = await getFinancialContext(userId);
            const spent = finContext.totalSpent || 0;
            const goal = finContext.goalTarget || 0;
            const score = finContext.smartScore != null ? `${finContext.smartScore}/100` : "Good";
            const topCats = finContext.topCategories || "general spending";

            return `Here is your current financial snapshot:\n\n` +
                `• **Smart Score**: ${score}\n` +
                `• **Current Spend**: ₹${spent}${goal > 0 ? ` (Goal: ₹${goal})` : ""}\n` +
                `• **Top Categories**: ${topCats}\n\n` +
                `💡 **Coach Tip**: Keep tracking your transactions and stay mindful of category limits to maximize your savings!`;
        } catch {
            return "I'm focusing on your numbers right now! 🧠 Try checking your **Dashboard** or **Goals** page for the latest updates.";
        }
    } finally {
        // RELEASE LOCK ALWAYS
        userProcessingLock.delete(userId);
    }
};


// 3. DETERMINISTIC INSIGHT GENERATOR (No AI)
const generateDeterministicInsight = (amount, category, finContext, bestOffer) => {
    const goal = finContext.goalTarget || 0;
    const spent = finContext.totalSpent || 0;
    const savings = bestOffer ? (bestOffer.calculated_savings || 0) : 0;

    // 1. Determine Status
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    let status = "ON_TRACK";
    let statusLabel = "On Track";

    if (goal > 0) {
        const projectedSpend = spent + Number(amount);
        const spendRatio = projectedSpend / goal;

        if (spendRatio > 1.0) {
            status = "OFF_TRACK";
            statusLabel = "Budget Exceeded";
        } else if (spendRatio > (monthProgress + 0.15)) {
            status = "OFF_TRACK";
            statusLabel = "Off Track";
        } else if (spendRatio > (monthProgress + 0.05)) {
            status = "SLIGHTLY_OFF";
            statusLabel = "Slightly Off Track";
        }
    } else {
        status = "NO_GOAL";
        statusLabel = "No Goal Set";
    }

    // 2. Generate Content based on Status (Necessity Check & Alternatives)
    let context = "";  // The Question
    let tradeoff = ""; // The Buffer Impact
    let impact = "";   // The Alternative

    const remaining = Math.max(0, goal - spent - Number(amount));

    // --- IMPROVED DETERMINISTIC ALTERNATIVES (AI-LIKE) ---
    const catLower = (category || "").toLowerCase();
    let specificAlternative = "Delay this purchase by 24 hours.";

    if (catLower.includes("dining") || catLower.includes("food") || catLower.includes("restaurant")) {
        specificAlternative = "Cook a meal at home or find a cheaper place.";
    } else if (catLower.includes("shopping") || catLower.includes("clothing") || catLower.includes("retail")) {
        specificAlternative = "Check for a sale or wait 3 days.";
    } else if (catLower.includes("travel") || catLower.includes("fuel") || catLower.includes("transport")) {
        specificAlternative = "Consider carpooling or public transport.";
    } else if (catLower.includes("entertainment") || catLower.includes("movie")) {
        specificAlternative = "Look for free local events instead.";
    }

    switch (status) {
        case "ON_TRACK":
            context = `You are on track (Budget: ₹${goal}). Is this necessary?`;
            tradeoff = `You have a healthy buffer of ₹${remaining}.`;
            impact = bestOffer && bestOffer.calculated_savings > 0
                ? `Alternative: Use ${bestOffer.card_name} to save ₹${savings}.`
                : `Alternative: ${specificAlternative}`;
            break;

        case "SLIGHTLY_OFF":
            context = "Spending is slightly faster than planned. Is this necessary?";
            tradeoff = `This reduces your remaining safe-spend buffer to ₹${remaining}.`;
            impact = `Alternative: ${specificAlternative}`;
            break;

        case "OFF_TRACK":
            context = `Warning: You are OFF TRACK. Is this purchase necessary?`;
            tradeoff = goal > 0
                ? `You only have ₹${remaining} left for the month.`
                : "This purchase adds to an already exceeded trend.";
            impact = `Alternative: ${specificAlternative}`;
            break;

        case "NO_GOAL":
        default:
            context = `You are spending ₹${amount} on ${category}. Is this necessary?`;
            tradeoff = "Set a monthly goal to track the impact of this spend.";
            impact = `Alternative: ${specificAlternative}`;
            break;
    }

    return {
        status: statusLabel,
        context,
        tradeoff,
        impact
    };
};

// NEW: Pre-Pay Intervention Logic
export const analyzePrePayTransaction = async (userId, amount, category) => {
    try {
        const finContext = await getFinancialContext(userId);

        // Fetch Best Offer for Context
        const bestOffer = await findBestOfferWaterfall(userId, amount, category, null);

        // 1. Generate Deterministic Insight (ALWAYS AVAILABLE)
        const deterministicInsight = generateDeterministicInsight(amount, category, finContext, bestOffer);

        // 2. Calculate Contextual Metrics (Backend Source of Truth)
        const currentSpent = finContext.totalSpent || 0;
        const goal = finContext.goalTarget || 0;
        const goalImpactPercent = goal > 0 ? ((Number(amount) / goal) * 100).toFixed(1) : 0;

        // 3. STRICT GEMINI CALL (Only if needed, but per request we use Gemini as ONLY LLM)
        // Rate limiting is less critical here as this is a transactional checkout flow, 
        // but we should still wrap it to be safe.

        console.log(`[GEMINI_PREPAY_CALL] User: ${userId} | Amount: ${amount}`);

        const prompt = `
          User is about to pay ₹${amount} for ${category}.
          
          FINANCIAL REALITY:
          - Budget: ₹${goal}
          - Spent so far: ₹${currentSpent}
          - GOAL STATUS: ${deterministicInsight.status}
          - This purchase uses: ${goalImpactPercent}% of total budget.
          
          TASK:
          Generate a "Pre-Pay Intervention" in strict JSON format.
          1. CONTENT RULES:
             - **Context**: Acknowledge the category specifically.
             - **Impact**: Explain clearly how this affects the remaining budget.
             - **Alternative**: MUST be a concrete, actionable alternative based on the category.
               - IF Dining/Food: Suggest "Cook a meal at home", "Order a smaller portion", or "Skip the drink/dessert".
               - IF Shopping: Suggest "Wait 24 hours", "Check for a sale", or "Review your closet first".
               - IF Travel: Suggest "Use public transport" or "Carpool".
               - IF Entertainment: Suggest "Free local events" or "A movie night at home".
               - DEFAULT: "Delay this purchase by 24 hours."

          2. TONE RULES:
             - ON TRACK: Supportive helper. "Enjoy, but stay mindful!"
             - OFF TRACK/EXCEEDED: Strict Financial Coach. "This is risky. Do you really need it?"
          
          OUTPUT JSON:
          {
            "intervention_needed": ${deterministicInsight.status === 'Off Track' || deterministicInsight.status === 'Budget Exceeded'},
            "message": "Direct advice string.",
            "context": "Context string (e.g., 'You are spending ₹${amount} on ${category}...')",
            "tradeoff": "Tradeoff string (e.g., 'This reduces your buffer to...')",
            "impact": "Specific Alternative string (e.g., 'Alternative: Cook at home to save ₹${amount}...')",
            "suggestion_type": "${deterministicInsight.status === 'On Track' ? 'optimize' : 'reduce'}",
            "suggested_action": "${deterministicInsight.status === 'On Track' ? 'Use Best Card' : 'Wait 24h'}"
          }
        `;

        try {
            const jsonText = await generateWithGemini(prompt, true);
            const aiResult = JSON.parse(jsonText);

            // MERGE AI result with Deterministic Insight
            return {
                ...aiResult,
                structured_insight: {
                    ...deterministicInsight, // Fallback defaults
                    context: aiResult.context || deterministicInsight.context,
                    tradeoff: aiResult.tradeoff || deterministicInsight.tradeoff,
                    impact: aiResult.impact || deterministicInsight.impact
                }
            };

        } catch (err) {
            console.error("[GEMINI_PREPAY_ERROR]", err.message);
            // Deterministic Fallback
            return {
                intervention_needed: true,
                message: `Spending ₹${amount} now takes up ${goalImpactPercent}% of your goal. Is this essential?`,
                suggestion_type: "reduce",
                suggested_action: "Wait 24h",
                structured_insight: deterministicInsight // ATTACH FALLBACK INSIGHT
            };
        }

    } catch (error) {
        console.error("Pre-Pay Logic Error:", error);

        // SAFE FALLBACK: Generate Financial Insight even on error
        const safeFinContext = { goalTarget: 0, totalSpent: 0 };
        const safeInsight = generateDeterministicInsight(amount, category, safeFinContext, null);

        return {
            intervention_needed: false,
            message: "Please proceed with your payment if planned.",
            suggestion_type: "safe",
            structured_insight: safeInsight
        };
    }
};
