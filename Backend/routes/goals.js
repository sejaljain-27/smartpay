import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * POST /goals
 * Create a monthly goal
 */
router.post("/", async (req, res) => {
  try {
    const { target_amount, month } = req.body;

    const result = await pool.query(
      "INSERT INTO goals (user_id, target_amount, month) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, target_amount, month]
    );

    res.json({
      message: "Goal created",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

/**
 * GET /goals/progress?month=YYYY-MM
 */
router.get("/progress", async (req, res) => {
  try {
    const { month } = req.query;

    const goalResult = await pool.query(
      "SELECT * FROM goals WHERE user_id = $1 AND month = $2 ORDER BY created_at DESC LIMIT 1",
      [req.user.id, month]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: "No goal found for this month" });
    }

    const goal = goalResult.rows[0];

    const spendingResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS spent
      FROM transactions
      WHERE user_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2
      `,
      [req.user.id, month]
    );

    const spent = Number(spendingResult.rows[0].spent);
    const target = Number(goal.target_amount);
    const remaining = target - spent;
    const percentage = Math.min(Math.round((spent / target) * 100), 100);

    res.json({
      month,
      target,
      spent,
      remaining,
      percentage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate progress" });
  }
});

/**
 * POST /goals/category
 * Create or Update a category goal
 */
router.post("/category", async (req, res) => {
  try {
    const { category, limit_amount } = req.body;

    if (!category || !limit_amount) {
      return res.status(400).json({ error: "Category and limit are required" });
    }

    // Upsert Logic (PostgreSQL ON CONFLICT)
    const result = await pool.query(
      `INSERT INTO category_goals (user_id, category, limit_amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category)
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount, created_at = NOW()
       RETURNING *`,
      [req.user.id, category, limit_amount]
    );

    res.json({
      message: "Category goal saved",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Category Goal Error:", error);
    res.status(500).json({ error: "Failed to save category goal" });
  }
});

/**
 * GET /goals/category
 * Get all category goals for the user
 */
router.get("/category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM category_goals WHERE user_id = $1",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get Category Goals Error:", error);
    res.status(500).json({ error: "Failed to fetch category goals" });
  }
});

export default router;
