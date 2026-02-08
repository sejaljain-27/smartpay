import pool from "../db.js";

/**
 * Month Helper
 */
function getCurrentMonth() {
    const d = new Date();
    return d.toISOString().slice(0, 7); // YYYY-MM
}

/**
 * 1. Income Resolution Logic
 */
function resolveIncome(userProfile, totalExpenses) {
    // 1. Direct Income (Not available in schema yet, skipping)

    // 2. Profile default mapping
    const occupationMap = {
        "student": 10000,
        "salaried": 30000,
        "freelancer": 25000,
        "self_employed": 40000
    };

    let profileIncome = 0;
    // Map income range if available
    const incomeRangeMap = {
        "below_15k": 12000,
        "15k_30k": 22500,
        "30k_50k": 40000,
        "50k_plus": 60000
    };

    if (userProfile.income_range && incomeRangeMap[userProfile.income_range]) {
        profileIncome = incomeRangeMap[userProfile.income_range];
    } else if (userProfile.occupation && occupationMap[userProfile.occupation.toLowerCase()]) {
        profileIncome = occupationMap[userProfile.occupation.toLowerCase()];
    }

    // 4. Expense-based estimation (Capped to avoid score manipulation)
    // If we assume Income = Expenses / 0.7, then Ratio is always 0.7 (Score 25). 
    // This is bad if they are overspending.
    // FIX: If expenses are very high (e.g. > 50k), assume a lower leverage or cap the estimated income
    // to reflect that this might be debt spending, not income.

    // Better Approach: Use the Income Range from profile if available as a HARD constraint.
    // If nothing available, use a conservative multiplier but do not let it scale infinitely.

    const expensesBasedIncome = totalExpenses; // Assume they earn what they spend (Ratio 1.0 -> Score 5/15)
    // This makes the ratio 1.0, which gives a 'Warning' or 'Poor' score (15 or 5 pts).

    // Priority: Profile/Range -> Expense -> Fallback
    return profileIncome > 0 ? profileIncome : (expensesBasedIncome > 0 ? expensesBasedIncome : 20000);
}

/**
 * COMPONENT 1: Spending Discipline (Max 45 pts)
 * Reallocated Budget points here.
 */
function calculateSpendingScore(totalExpenses, income) {
    if (income === 0) return 0;
    const ratio = totalExpenses / income;

    if (ratio <= 0.3) return 45; // Excellent
    if (ratio <= 0.5) return 35; // Good
    if (ratio <= 0.7) return 25; // Average
    if (ratio <= 0.9) return 15; // Warning
    return 5; // Poor
}

/**
 * COMPONENT 2: Budget Adherence (0 pts)
 * Redistributed to Spending and Savings.
 */
function calculateBudgetScore() {
    return 0;
}

/**
 * COMPONENT 3: Savings Consistency (Max 30 pts)
 * Reallocated Budget points here.
 */
function calculateSavingsScore(income, totalExpenses, savingsGoal) {
    const actualSavings = income - totalExpenses;

    // If no goal set, but saving money
    if (!savingsGoal || savingsGoal <= 0) {
        return actualSavings > 0 ? 10 : 0;
    }

    const ratio = actualSavings / savingsGoal;

    if (actualSavings >= savingsGoal) return 30; // Hit Goal
    if (ratio >= 0.8) return 25; // Close
    if (ratio >= 0.5) return 15; // Halfway
    if (actualSavings > 0) return 10; // At least positive
    return 0;
}

/**
 * COMPONENT 4: Regularity (Max 15 pts)
 */
function calculateRegularityScore(transactionDays, totalDaysInMonth) {
    if (totalDaysInMonth === 0) return 0;
    // Boost score faster: 1 tx every 3 days is good
    const ratio = transactionDays / totalDaysInMonth;
    if (ratio >= 0.5) return 15; // Very active
    if (ratio >= 0.3) return 10; // Moderate
    if (ratio > 0) return 5;     // Active
    return 0;
}

/**
 * COMPONENT 5: Financial Engagement (Max 10 pts)
 */
function calculateEngagementScore(streak, hasGoal, hasBudget) {
    let score = 0;
    if (streak > 0) score += 5;
    if (hasGoal) score += 5;
    return Math.min(10, score);
}

export async function calculateSmartScore(userId) {
    const month = getCurrentMonth();

    // 1. Fetch Data
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const userProfile = userResult.rows[0] || {};

    const txResult = await pool.query(
        "SELECT ABS(amount) as amount, created_at FROM transactions WHERE user_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2 AND type = 'debited'",
        [userId, month]
    );
    const transactions = txResult.rows;

    const goalResult = await pool.query(
        "SELECT target_amount FROM goals WHERE user_id = $1 AND month = $2",
        [userId, month]
    );
    const savingsGoal = goalResult.rows.length > 0 ? Number(goalResult.rows[0].target_amount) : 0;

    // 2. Aggregate Data
    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const income = resolveIncome(userProfile, totalExpenses);

    // Regularity
    const uniqueDays = new Set(transactions.map(t => new Date(t.created_at).getDate())).size;
    const today = new Date().getDate(); // Days so far in month

    // 3. Compute Scores
    const breakdown = {
        spending: calculateSpendingScore(totalExpenses, income),
        budget: calculateBudgetScore(),
        savings: calculateSavingsScore(income, totalExpenses, savingsGoal),
        regularity: calculateRegularityScore(uniqueDays, today),
        engagement: calculateEngagementScore(uniqueDays > 0, savingsGoal > 0, false)
    };

    const smartScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
        smartScore: Math.round(smartScore),
        breakdown,
        meta: {
            income,
            totalExpenses,
            savingsGoal
        }
    };
}
