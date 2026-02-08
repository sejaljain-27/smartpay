import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

// POST /cards - Add a card
router.post("/", async (req, res) => {
  try {
    const { card_name, bank, card_type, last_digits, network } = req.body;
    if (!card_name) {
      return res.status(400).json({ error: "card_name required" });
    }
    const result = await pool.query(
      "INSERT INTO user_cards (user_id, card_name, bank, card_type, last_digits, network) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.user.id, card_name, bank, card_type, last_digits, network]
    );
    res.status(201).json({ card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add card" });
  }
});

// GET /cards - List user's cards
router.get("/", async (req, res) => {
  try {
    // Fetch cards with stats
    const result = await pool.query(`
      WITH card_stats AS (
        SELECT 
          card_name, 
          COALESCE(SUM(savings), 0) as total_saved,
          COUNT(*) as usage_count
        FROM transactions 
        WHERE user_id = $1 AND card_name IS NOT NULL
        GROUP BY card_name
      ),
      total_tx AS (
        SELECT COUNT(*) as total FROM transactions WHERE user_id = $1
      )
      SELECT 
        uc.*,
        COALESCE(cs.total_saved, 0) as total_saved,
        COALESCE(cs.usage_count, 0) as usage_count,
        COALESCE(tt.total, 0) as total_transactions
      FROM user_cards uc
      LEFT JOIN card_stats cs ON 
        uc.card_name = cs.card_name 
        OR uc.bank = cs.card_name 
        OR cs.card_name ILIKE '%' || uc.bank || '%' 
        OR uc.card_name ILIKE '%' || cs.card_name || '%'
      CROSS JOIN total_tx tt
      WHERE uc.user_id = $1 
      ORDER BY uc.created_at DESC
    `, [req.user.id]);

    // Process rows to calculate usage rate
    const cards = result.rows.map(card => ({
      ...card,
      usage_rate: card.total_transactions > 0
        ? Math.round((parseInt(card.usage_count) / parseInt(card.total_transactions)) * 100)
        : 0
    }));

    res.json({ cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// DELETE /cards/:id - Remove a card
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "DELETE FROM user_cards WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    res.json({ message: "Card deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

export default router;
