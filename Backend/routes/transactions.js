import express from "express";
import pool from "../db.js";
import { categorizeTransaction } from "../services/categorizer.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// POST /transactions
router.post("/", async (req, res) => {
  try {
    let { amount, text, type, category } = req.body;

    if (!category) {
      category = categorizeTransaction(text);
    }

    // Auto-detect type if not provided
    if (!type) {
      const t = text.toLowerCase();
      if (t.includes("debited")) type = "debited";
      else if (t.includes("credited")) type = "credited";
      else type = "debited"; // default
    }

    // For debited, amount is negative; for credited, positive
    // This logic will be partially overridden by the hardcoded '-Math.abs(amount)' in the insert,
    // but keeping it for potential future flexibility or if 'signedAmount' is used elsewhere.
    let signedAmount = Number(amount);
    if (type === "debited") signedAmount = -Math.abs(signedAmount);
    else if (type === "credited") signedAmount = Math.abs(signedAmount);

    // The instruction implies a specific use case where transactions are always 'debited'
    // and includes 'created_at' and different variable names.
    // Adapting to the existing context:
    // - Use req.user.id for user_id
    // - Use the 'amount' from req.body, ensuring it's negative for debited
    // - Use 'text' from req.body
    // - Use 'category' (potentially auto-detected) from req.body
    // - Hardcode 'type' to 'debited' as per instruction
    // - Add 'created_at' and use 'new Date()' for its value.
    // Production Fix: Explicitly map all columns and normalize values
    const payload = {
      user_id: req.user.id,
      amount: -Math.abs(Number(amount)),
      text: text,
      category: category,
      type: 'debited',
      created_at: new Date(),
      // Explicitly set these to avoid undefined/null in production
      ignored_offer: false,
      missed_saving_amount: 0,
      card_name: null,
      recommended_card: null,
      bank_name: null,
      available_balance: null
    };

    console.log("Saving transaction (Manual):", payload);

    const result = await pool.query(
      `INSERT INTO transactions 
      (user_id, amount, text, category, type, created_at, ignored_offer, missed_saving_amount, card_name, recommended_card, bank_name, available_balance) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        payload.user_id,
        payload.amount,
        payload.text,
        payload.category,
        payload.type,
        payload.created_at,
        payload.ignored_offer,
        payload.missed_saving_amount,
        payload.card_name,
        payload.recommended_card,
        payload.bank_name,
        payload.available_balance
      ]
    );

    res.json({
      message: "Transaction saved",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

// GET /transactions with filters
router.get("/", async (req, res) => {
  try {
    const { category, from, to } = req.query;

    let query = "SELECT * FROM transactions WHERE user_id = $1";
    const values = [req.user.id];

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    if (from) {
      values.push(from);
      query += ` AND created_at >= $${values.length}`;
    }

    if (to) {
      values.push(to);
      query += ` AND created_at <= $${values.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});
// GET /transactions/summary
// Expense summary (only debited)
router.get("/summary", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_expense FROM transactions WHERE user_id = $1 AND type = 'debited'",
      [req.user.id]
    );

    res.json({
      totalExpense: Math.abs(result.rows[0].total_expense)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate total expense" });
  }
});

// Total credited
router.get("/total-credited", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_credited FROM transactions WHERE user_id = $1 AND type = 'credited'",
      [req.user.id]
    );
    res.json({
      totalCredited: result.rows[0].total_credited
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate total credited" });
  }
});
// GET /transactions/category-summary
router.get("/category-summary", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE user_id = $1
      GROUP BY category
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category summary" });
  }
});



export default router;


