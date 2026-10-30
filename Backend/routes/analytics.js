
import express from "express";
import pool from "../db.js";
import { getSpendingBehavior, getGoalStatus, getGoalMomentum } from "../services/spendingBehaviorService.js";
import { clusterUserSpending, checkMlHealth } from "../services/mlService.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /analytics/ml-health
 * Check if the Python FastAPI ML microservice is online
 */
router.get("/ml-health", async (_req, res) => {
    try {
        const health = await checkMlHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({ online: false, error: error.message });
    }
});

router.get("/spending-behavior", authMiddleware, async (req, res) => {
    try {
        const data = await getSpendingBehavior(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch spending behavior" });
    }
});

/**
 * GET /analytics/spending-cluster
 * Uses the ML KMeans clustering model to classify user into spending personas
 */
router.get("/spending-cluster", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                LOWER(category) as cat,
                COALESCE(ABS(SUM(amount)), 0) as total
             FROM transactions
             WHERE user_id = $1 AND amount < 0
             GROUP BY LOWER(category)`,
            [req.user.id]
        );

        const breakdown = { food: 0, shopping: 0, transport: 0, utilities: 0 };
        for (const row of result.rows) {
            const cat = row.cat;
            const amt = parseFloat(row.total);
            if (cat.includes("food") || cat.includes("dining")) breakdown.food += amt;
            else if (cat.includes("shop")) breakdown.shopping += amt;
            else if (cat.includes("trans") || cat.includes("travel")) breakdown.transport += amt;
            else if (cat.includes("util") || cat.includes("bill")) breakdown.utilities += amt;
            else breakdown.shopping += amt; // default bucket
        }

        const cluster = await clusterUserSpending(breakdown);

        res.json({
            ...cluster,
            breakdown
        });
    } catch (error) {
        console.error("Cluster user error:", error);
        res.status(500).json({ error: "Failed to compute spending cluster" });
    }
});

router.get("/goals-status", authMiddleware, async (req, res) => {
    try {
        const data = await getGoalStatus(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch goal status" });
    }
});

router.get("/goal-momentum", authMiddleware, async (req, res) => {
    try {
        const data = await getGoalMomentum(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch goal momentum" });
    }
});

export default router;
