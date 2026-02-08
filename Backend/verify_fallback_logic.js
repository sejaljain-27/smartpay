
import 'dotenv/config';
import pool from './db.js';

async function verifyFallback() {
    try {
        const amount = 100;
        const category = "Random Category";
        const merchant = "Unknown Merchant 123";
        // Use normalized bank HDFC
        const userBanks = ["HDFC"];
        const userCardNames = ["Regalia"];

        console.log("Testing Fallback Logic with:", { category, merchant, userBanks });

        // 1. Fetch ALL potential offers (Simulating Broad Fetch)
        const offersResult = await pool.query(
            `SELECT * FROM card_offers WHERE $1 >= min_amount AND (bank = ANY($2) OR bank = 'Any' OR bank IS NULL)`,
            [amount, userBanks]
        );
        let candidates = offersResult.rows;
        console.log(`Debug: Found ${candidates.length} raw candidates (min_amount=0 helps here)`);

        // 2. Mock Scoring (Simplified version of offers.js logic)
        const scoredOffers = candidates.map(offer => {
            let score = 0;
            // skipping detailed matching logic for brevity, assuming 0 score for random input
            return { ...offer, matchScore: score };
        });

        let bestOffer = scoredOffers.find(o => o.matchScore >= 50);

        // 3. Fallback Check
        if (!bestOffer) {
            console.log("No specific offer found. Checking Fallback...");
            // Simulate user card fetch
            const cardsResult = await pool.query("SELECT * FROM user_cards WHERE bank = ANY($1)", [userBanks]);

            if (cardsResult.rows.length > 0) {
                const fallbackCard = cardsResult.rows[0];
                bestOffer = {
                    id: 'fallback',
                    bank: fallbackCard.bank,
                    card_name: fallbackCard.card_name,
                    merchant: merchant || "All Spends",
                    offer_id: "GENERIC_REWARD",
                    calculated_savings: Math.round(amount * 0.01) || 5,
                    description: `Standard 1% reward points on ${fallbackCard.card_name}`,
                    efficiency_score: 1.0,
                    category: "General" // distinct mark
                };
            }
        }

        if (bestOffer) {
            console.log("SUCCESS: Best Offer Returned:", bestOffer);
        } else {
            console.log("FAILURE: No offer returned even with fallback.");
        }

        await pool.end();

    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

verifyFallback();
