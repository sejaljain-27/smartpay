import express from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post("/best", authMiddleware, async (req, res) => {
    try {
        const { amount, category, merchant, paymentType } = req.body;
        const userId = req.user.id;

        // 0. QUICK CHECK: Amount too low
        if (amount < 200) {
            return res.json({
                message: "Amount too low for offers (< 200)",
                hasOffer: false,
                bestOffer: null
            });
        }

        // 1. Fetch user's cards
        const cardsResult = await pool.query(
            "SELECT bank, card_name FROM user_cards WHERE user_id = $1",
            [userId]
        );

        if (cardsResult.rows.length === 0) {
            return res.json({
                message: "No cards added by user",
                bestOffer: null
            });
        }

        const userBanks = [...new Set(cardsResult.rows.map(row => row.bank))];
        const userCardNames = cardsResult.rows.map(row => row.card_name);

        // 2. Fetch User Goal for Context (Smart Scoring)
        const currentMonth = new Date().toISOString().slice(0, 7);
        const goalResult = await pool.query(
            "SELECT target_amount FROM goals WHERE user_id = $1 AND month = $2",
            [userId, currentMonth]
        );
        const userSavingGoal = goalResult.rows.length > 0 ? Number(goalResult.rows[0].target_amount) : 0;

        // 3. Fetch ALL potential offers for these banks (Broad Fetch)
        const offersResult = await pool.query(
            `
      SELECT *
      FROM card_offers
      WHERE
        $1 >= min_amount
        AND (
          bank = ANY($2)
          OR bank = 'Any'
          OR bank IS NULL
        )
      `,
            [amount, userBanks]
        );

        // 3b. EXPLICIT FILTER (User Request): double-check min_amount in JS
        let candidates = offersResult.rows.filter(offer => {
            const minAmt = Number(offer.min_amount) || 0;
            return amount >= minAmt;
        });

        // 4. Scoring Algorithm
        const scoredOffers = candidates.map(offer => {
            let score = 0;
            const offerMerchant = (offer.merchant || "").toLowerCase();
            const inputMerchant = (merchant || "").toLowerCase();
            const offerCat = (offer.category || "").toLowerCase();
            const inputCat = (category || "").toLowerCase();

            // A. Merchant Match (Highest Priority)
            if (offerMerchant !== "all" && offerMerchant !== "any") {
                if (inputMerchant.includes(offerMerchant) || offerMerchant.includes(inputMerchant)) {
                    score += 100;
                }
            }

            // B. Category Match (Medium Priority)
            if (inputCat.includes(offerCat) || offerCat.includes(inputCat)) {
                score += 50;
            }
            // Special aliases
            if (inputCat.includes("dining") && (offerCat.includes("dining") || offerCat.includes("food"))) score += 50;
            if (inputCat.includes("bill") && (offerCat.includes("bill") || offerCat.includes("utility"))) score += 50;
            if (inputCat.includes("shop") && offerCat.includes("shop")) score += 50;

            // C. Generic/Wildcard Merchant Match (Low Priority but good valid match)
            if (offerMerchant.includes("all") || offerMerchant.includes("any") || offerMerchant.includes("general") || offerMerchant.includes("partner")) {
                // Only trigger generic merchant match if we have a category match
                if (score >= 50) {
                    score += 10;
                }
            }

            // D. Card Specificity (Tie-breaker)
            if (offer.card_name && userCardNames.includes(offer.card_name)) {
                score += 5;
            }

            // --- SAVINGS CALCULATION (Fixed Case Handling) ---
            let savings = 0;
            const dType = (offer.discount_type || "").toLowerCase();

            if (dType.startsWith("percentage") || dType.includes("%")) {
                savings = (amount * offer.discount_value) / 100;
                if (offer.max_discount && savings > offer.max_discount) {
                    savings = offer.max_discount;
                }
            } else if (dType.startsWith("flat") || dType.includes("cashback")) {
                savings = offer.discount_value;
            }

            // CAP SAVINGS AT TRANSACTION AMOUNT
            if (savings > amount) {
                savings = amount;
            }

            // --- EFFICIENCY SCORE CALCULATION ---
            // 1. Efficiency based on ROI (Return on Investment/Spend)
            let efficiency = 0;
            if (amount > 0) {
                efficiency = (savings / amount) * 100; // Base percentage (e.g., 10.0%)
            }

            // 2. Goal Alignment Boost
            // If user has a goal, any saving is more "efficient" for them.
            if (userSavingGoal > 0 && savings > 0) {
                efficiency *= 1.2; // 20% Boost for goal alignment
            }

            // 3. Trust Level Boost (If column exists, assumed mapped or default)
            const trustLevel = (offer.trust_level || "MEDIUM").toUpperCase();
            if (trustLevel === "HIGH") efficiency += 2.0;
            else if (trustLevel === "MEDIUM") efficiency += 1.0;
            else if (trustLevel === "LOW") efficiency -= 1.0;

            // Cap/Format
            // Heuristic: Score = (Percentage Return) / 2. 
            // e.g. 10% return -> Score 5.0. 
            let finalEfficiency = (efficiency) / 2;
            if (finalEfficiency > 10) finalEfficiency = 10;
            if (finalEfficiency < 0) finalEfficiency = 0.0; // Don't show negative efficiency
            if (finalEfficiency === 0 && savings > 0) finalEfficiency = 0.5; // Minimum positive score

            return {
                ...offer,
                matchScore: score,
                calculated_savings: Math.round(savings),
                final_amount: Math.round(amount - savings),
                efficiency_score: parseFloat(finalEfficiency.toFixed(1))
            };
        });

        // 5. Sort by Score desc, then Savings desc
        scoredOffers.sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            return b.calculated_savings - a.calculated_savings;
        });

        // 6. Select Best Offer or Fallback
        // Strictness: We only accept offers with Score >= 50 (at least Category match)
        let bestOffer = scoredOffers.find(o => o.matchScore >= 50);

        // NUCLEAR FALLBACK: If absolutely nothing matches, create a generic "Reward Points" offer for their first card
        // FIX: Ensure fallback also respects a basic minimum (e.g. > 200rs) to avoid 1rs offers
        if (!bestOffer && cardsResult.rows.length > 0 && amount >= 200) {
            const fallbackCard = cardsResult.rows[0];
            bestOffer = {
                id: 'fallback',
                bank: fallbackCard.bank,
                card_name: fallbackCard.card_name,
                merchant: merchant || "All Spends",
                offer_id: "GENERIC_REWARD",
                calculated_savings: Math.round(amount * 0.01) || 5, // 1% or min 5 rs
                description: `Standard 1% reward points on ${fallbackCard.card_name}`,
                efficiency_score: 1.0,
                category: category || "General",
                valid_to: "2099-12-31"
            };
        }

        res.json({
            hasOffer: !!bestOffer,
            bestOffer: bestOffer,
            debug: {
                matchedOffersCount: scoredOffers.length,
                topCandidate: scoredOffers[0],
                input: { amount, category, merchant, userBanks, userSavingGoal }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Details fetch failed" });
    }
});

router.post("/use", authMiddleware, async (req, res) => {
    try {
        const { amount, category, merchant, card_name, offer_id, savings, ignored_offer, missed_saving_amount, recommended_card, decision } = req.body;
        const userId = req.user.id;

        // Calculate final amount paid
        // If ignored_offer is true, the savings were NOT applied, so finalAmount = amount
        const effectiveSavings = ignored_offer ? 0 : (savings || 0);
        const finalAmount = Math.max(0, amount - effectiveSavings);

        // Construct transaction text
        let txText = `Paid to ${merchant}`;
        if (card_name) txText += ` using ${card_name}`;
        if (!ignored_offer && savings > 0) txText += ` (Saved ₹${savings})`;
        if (ignored_offer) txText += ` (Ignored Offer)`;

        // NEW: Handle AI Decision Logic
        let type = 'debited';
        let amountToStore = -Math.abs(finalAmount);

        // If User ACCEPTED AI Advice -> Treat as SAVINGS (Money NOT Spent)
        if (decision === 'ai_accepted') {
            type = 'credited';
            amountToStore = Math.abs(amount); // Store as POSITIVE (Saved)
            txText = `Smart Saving: Avoided expense at ${merchant}`;
            if (decision) txText += ` [AI: ${decision}]`;
        } else {
            // Standard Logic
            if (decision) txText += ` [AI: ${decision}]`;
        }

        // Insert into transactions table
        // Production Fix: Explicitly normalize all inputs
        const payload = {
            user_id: userId,
            amount: amountToStore,
            text: txText,
            category: decision === 'ai_accepted' ? 'Savings' : category,
            type: type,
            created_at: new Date(),
            ignored_offer: ignored_offer || false,
            missed_saving_amount: missed_saving_amount || 0,
            recommended_card: recommended_card || null,
            // Ensure card_name is passed or null
            card_name: card_name || null,
            bank_name: null,
            available_balance: null
        };

        console.log("Recording Offer Transaction:", payload);

        // Insert into transactions table
        const result = await pool.query(
            `INSERT INTO transactions 
            (user_id, amount, text, category, type, created_at, ignored_offer, missed_saving_amount, recommended_card, card_name, bank_name, available_balance) 
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
                payload.recommended_card,
                payload.card_name,
                payload.bank_name,
                payload.available_balance
            ]
        );

        res.json({
            message: "Transaction recorded successfully",
            transaction: result.rows[0]
        });

    } catch (err) {
        console.error("Transaction record failed:", err);
        res.status(500).json({ error: "Failed to record transaction" });
    }
});

export default router;
