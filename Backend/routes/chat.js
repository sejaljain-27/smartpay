import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { processChatMessage } from "../services/chatService.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const reply = await processChatMessage(req.user.id, message);
        res.json({ reply });

    } catch (error) {
        console.error("Chat Route Error:", error);
        res.status(500).json({ error: "Failed to process chat message" });
    }
});

// NEW: Pre-Pay Intervention Endpoint
router.post("/pre-pay", async (req, res) => {
    try {
        const { amount, category } = req.body;
        if (!amount || !category) return res.status(400).json({ error: "Amount and category required" });

        // Import dynamically if needed or rely on top-level import
        const { analyzePrePayTransaction } = await import("../services/chatService.js");
        const advice = await analyzePrePayTransaction(req.user.id, amount, category);

        res.json(advice);
    } catch (error) {
        console.error("Pre-Pay Route Error:", error);
        res.status(500).json({ intervention_needed: false, message: "Proceed safely." });
    }
});

export default router;
