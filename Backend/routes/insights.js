import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /insights/total
 * Total expense (sum of negative amounts)
 */
router.get("/total", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Corrected from req.user.userId based on previous files

    // 1. Get Total Expense
    const expenseResult = await pool.query(
      `SELECT COALESCE(ABS(SUM(amount)), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0`,
      [userId]
    );

    // 2. Get Latest Bank Balance & Name
    const balanceResult = await pool.query(
      `SELECT bank_name, available_balance
       FROM transactions
       WHERE user_id = $1 AND available_balance IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const latest = balanceResult.rows[0] || {};

    res.json({
      totalExpense: expenseResult.rows[0].total,
      bankName: latest.bank_name || null,
      availableBalance: latest.available_balance || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch total expense" });
  }
});

/**
 * GET /insights/savings
 * Total Savings (Income - Expenses)
 * Actually, since expenses are negative, SUM(amount) gives the balance/savings.
 */
router.get("/savings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ totalSavings: result.rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch total savings" });
  }
});

/**
 * GET /insights/category
 * Category-wise expense totals (pie chart)
 */
router.get("/category", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT category, ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category insights" });
  }
});

/**
 * GET /insights/daily
 * Daily expense trend (line chart)
 */
router.get("/daily", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DATE(created_at) AS date, ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch daily trend" });
  }
});

/**
 * GET /insights/weekly
 */
router.get("/weekly", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DATE_TRUNC('week', created_at) AS week, ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0
       GROUP BY week
       ORDER BY week`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weekly insights" });
  }
});

/**
 * GET /insights/monthly
 */
router.get("/monthly", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0
       GROUP BY month
       ORDER BY month`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch monthly insights" });
  }
});

/**
 * GET /insights/behavior
 * Percentage spending behavior by category
 */
router.get("/behavior", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total expense (denominator)
    const totalResult = await pool.query(
      `SELECT ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0`,
      [userId]
    );

    const categoryResult = await pool.query(
      `SELECT category, ABS(SUM(amount)) AS total
       FROM transactions
       WHERE user_id = $1 AND amount < 0
       GROUP BY category`,
      [userId]
    );

    const total = Number(totalResult.rows[0].total) || 0;

    const insights = categoryResult.rows.map(row => ({
      category: row.category,
      percentage:
        total === 0 ? 0 : ((Number(row.total) / total) * 100).toFixed(2)
    }));

    res.json(insights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch behavior insights" });
  }
});

import { calculateSmartScore } from "../services/smartScore.js";

/**
 * GET /insights/score
 * Get detailed Smart Score breakdown
 */
router.get("/score", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const scoreData = await calculateSmartScore(userId);
    res.json(scoreData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate Smart Score" });
  }
});

export default router;
