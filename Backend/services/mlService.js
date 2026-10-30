const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Predict transaction category using the ML model (/predict-category).
 * Falls back to keyword/default category if ML service is unreachable.
 * 
 * @param {string} text - Transaction description or SMS body
 * @param {string} fallbackCategory - Fallback category if ML is offline
 * @returns {Promise<{category: string, confidence: number, source: string}>}
 */
export async function predictCategory(text, fallbackCategory = "Others") {
  if (!text || typeof text !== "string") {
    return { category: fallbackCategory, confidence: 0, source: "default" };
  }

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict-category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(2000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.category) {
        return {
          category: data.category,
          confidence: Number(data.confidence || 0),
          source: "ml"
        };
      }
    }
  } catch (err) {
    // Graceful fallback when ML service is offline
    console.debug(`[ML Service] Predict category offline (${err.message}). Using fallback: ${fallbackCategory}`);
  }

  return { category: fallbackCategory, confidence: 0, source: "fallback" };
}

/**
 * Predict budget goal risk using the ML model (/predict-goal-risk).
 * 
 * @param {number} avgDailySpend - Average daily spend so far
 * @param {number} daysRemaining - Days remaining in the month
 * @param {number} goalAmount - Total target budget amount
 * @returns {Promise<{risk: string, source: string}>}
 */
export async function predictGoalRisk(avgDailySpend, daysRemaining, goalAmount) {
  const safeAvgDaily = Math.max(0, Number(avgDailySpend) || 0);
  const safeDaysRemaining = Math.max(1, Number(daysRemaining) || 1);
  const safeGoalAmount = Math.max(1, Number(goalAmount) || 1);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict-goal-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avg_daily_spend: safeAvgDaily,
        days_remaining: safeDaysRemaining,
        goal_amount: safeGoalAmount
      }),
      signal: AbortSignal.timeout(2000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.risk !== undefined) {
        return {
          risk: String(data.risk).toUpperCase(),
          source: "ml"
        };
      }
    }
  } catch (err) {
    console.debug(`[ML Service] Predict goal risk offline (${err.message}). Using heuristic.`);
  }

  // Heuristic fallback if ML service is unreachable
  const projectedSpend = safeAvgDaily * safeDaysRemaining;
  const isHighRisk = projectedSpend > safeGoalAmount * 0.9;
  return {
    risk: isHighRisk ? "HIGH" : "LOW",
    source: "heuristic"
  };
}

/**
 * Cluster user spending behavior (/cluster-user).
 * 
 * @param {object} categories - Object containing food, shopping, transport, utilities
 * @returns {Promise<{cluster_id: number, spender_type: string, top_category: string, top_category_percentage: number, source: string}>}
 */
export async function clusterUserSpending({ food = 0, shopping = 0, transport = 0, utilities = 0 }) {
  const payload = {
    food: Math.max(0, Number(food) || 0),
    shopping: Math.max(0, Number(shopping) || 0),
    transport: Math.max(0, Number(transport) || 0),
    utilities: Math.max(0, Number(utilities) || 0)
  };

  try {
    const res = await fetch(`${ML_SERVICE_URL}/cluster-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        source: "ml"
      };
    }
  } catch (err) {
    console.debug(`[ML Service] Cluster user offline (${err.message}). Using heuristic.`);
  }

  // Heuristic fallback
  const total = payload.food + payload.shopping + payload.transport + payload.utilities;
  const entries = Object.entries(payload);
  entries.sort((a, b) => b[1] - a[1]);
  const [topCat, topVal] = entries[0] || ["Food", 0];
  const pct = total > 0 ? Math.round((topVal / total) * 10000) / 100 : 0;

  return {
    cluster_id: 0,
    spender_type: `${topCat}-focused Spender`,
    top_category: topCat.charAt(0).toUpperCase() + topCat.slice(1),
    top_category_percentage: pct,
    source: "heuristic"
  };
}

/**
 * Check if the Python FastAPI ML Service is healthy and reachable.
 * 
 * @returns {Promise<{online: boolean, url: string, message?: string}>}
 */
export async function checkMlHealth() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data = await res.json();
      return { online: true, url: ML_SERVICE_URL, ...data };
    }
  } catch (err) {
    return { online: false, url: ML_SERVICE_URL, error: err.message };
  }
  return { online: false, url: ML_SERVICE_URL };
}
