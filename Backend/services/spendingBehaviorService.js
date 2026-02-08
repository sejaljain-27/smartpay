
import pool from "../db.js";

/**
 * Get spending behavior analytics for a user.
 * Aggregates transactions by day over the last 365 days.
 * 
 * @param {number} userId 
 * @returns {Promise<Array<{date: string, credits: number, debits: number, net: number, behavior: string}>>}
 */
export async function getSpendingBehavior(userId) {
    const query = `
    SELECT
      DATE(created_at) as day,
      SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) as credits,
      SUM(CASE WHEN type='debit' THEN amount ELSE 0 END) as debits,
      SUM(
        CASE 
          WHEN type='credit' THEN amount
          ELSE -amount
        END
      ) as net
    FROM transactions
    WHERE user_id = $1
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day ASC;
  `;

    try {
        const result = await pool.query(query, [userId]);

        return result.rows.map(row => {
            const net = parseFloat(row.net);
            let behavior = 'neutral';
            if (net > 0) behavior = 'positive';
            if (net < 0) behavior = 'negative';

            return {
                date: row.day.toISOString().split('T')[0], // YYYY-MM-DD
                credits: parseFloat(row.credits),
                debits: parseFloat(row.debits),
                net: net,
                behavior
            };
        });
    } catch (error) {
        console.error("Error fetching spending behavior:", error);
        throw error;
    }
}

/**
 * Get goal status for trophy logic.
 * @param {number} userId
 * @returns {Promise<{goalAmount: number, currentSavings: number, achieved: boolean}>}
 */
export async function getGoalStatus(userId) {
    // Assuming simple goal logic: sum of all goals vs sum of all savings (net transactions)
    // Or maybe just the first goal?
    // Let's assume total savings vs total goals for now.

    // Calculate current savings as total income - total expense
    const savingsQuery = `
        SELECT 
            SUM(CASE WHEN type='credit' THEN amount ELSE -amount END) as total_savings
        FROM transactions
        WHERE user_id = $1
    `;

    const goalsQuery = `
        SELECT SUM(target_amount) as total_goal FROM goals WHERE user_id = $1
    `;

    try {
        const savingsRes = await pool.query(savingsQuery, [userId]);
        const goalsRes = await pool.query(goalsQuery, [userId]);

        const currentSavings = parseFloat(savingsRes.rows[0].total_savings || 0);
        const goalAmount = parseFloat(goalsRes.rows[0].total_goal || 0);

        return {
            goalAmount,
            currentSavings,
            achieved: goalAmount > 0 && currentSavings >= goalAmount
        };
    } catch (error) {
        console.error("Error fetching goal status:", error);
        throw error;
    }
}
/**
 * Get goal momentum data.
 * @param {number} userId
 * @returns {Promise<{currentSavings: number, goalAmount: number, credits: number, debits: number, netSavings: number}>}
 */
export async function getGoalMomentum(userId) {
    const query = `
        SELECT 
            SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) as credits,
            SUM(CASE WHEN type='debit' THEN amount ELSE 0 END) as debits,
            SUM(CASE WHEN type='credit' THEN amount ELSE -amount END) as net_savings
        FROM transactions
        WHERE user_id = $1
    `;

    const goalsQuery = `SELECT SUM(target_amount) as total_goal FROM goals WHERE user_id = $1`;

    try {
        const res = await pool.query(query, [userId]);
        const goalsRes = await pool.query(goalsQuery, [userId]);

        const credits = parseFloat(res.rows[0].credits || 0);
        const debits = parseFloat(res.rows[0].debits || 0);
        const netSavings = parseFloat(res.rows[0].net_savings || 0);
        const goalAmount = parseFloat(goalsRes.rows[0].total_goal || 0);

        return {
            currentSavings: netSavings,
            goalAmount,
            credits,
            debits,
            netSavings
        };
    } catch (error) {
        console.error("Error fetching goal momentum:", error);
        throw error;
    }
}
