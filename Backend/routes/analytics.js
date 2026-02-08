
import express from "express";
import { getSpendingBehavior, getGoalStatus, getGoalMomentum } from "../services/spendingBehaviorService.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/spending-behavior", authMiddleware, async (req, res) => {
    try {
        const data = await getSpendingBehavior(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch spending behavior" });
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
