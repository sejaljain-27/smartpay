import pool from "../db.js";

/**
 * Finds the best offer using a Waterfall approach:
 * 1. Strict Personal Match: User has specific card & meets criteria.
 * 2. Broad Match: Offer for Merchant/Category for 'Any' card.
 * 3. General Fallback: Best 'Any' card offer in the system (if enabled).
 */
export const findBestOfferWaterfall = async (userId, amount, category, merchant) => {
    try {
        const amt = Number(amount) || 0;
        const cat = (category || "").toLowerCase();
        const merch = (merchant || "").toLowerCase();

        console.log(`[OfferService] Waterfall Search: User=${userId}, Amt=${amt}, Cat=${cat}, Merch=${merch}`);

        // HARD LIMIT: Dont show offers for tiny amounts (requested by user)
        if (amt < 200) {
            console.log("[OfferService] Amount too low (< 200), skipping offers.");
            return null;
        }

        // 1. STRICT PERSONAL MATCH
        // Matches Merchant/Category AND (User owns card OR card is 'Any')
        // Using ILIKE for looser string matching on banks/cards
        const strictQuery = `
            SELECT DISTINCT ON (o.id) 
                o.*, 
                uc.card_name as matched_card,
                'Strict' as match_type
            FROM offers o
            LEFT JOIN user_cards uc ON (
                uc.card_name ILIKE '%' || o.card_required || '%' 
                OR uc.bank ILIKE '%' || o.card_required || '%'
            )
            WHERE 
                o.active = TRUE
                AND (LOWER(o.merchant) = $2 OR LOWER(o.category) = $3)
                AND (
                    LOWER(o.card_required) = 'any' 
                    OR uc.user_id = $1
                )
            ORDER BY o.id, o.discount_percentage DESC
        `;

        let result = await pool.query(strictQuery, [userId, merch, cat, amt]);

        if (result.rows.length > 0) {
            // Sort by discount
            const best = result.rows.sort((a, b) => b.discount_percentage - a.discount_percentage)[0];
            console.log(`[OfferService] STRICT Match Found: ${best.title}`);
            return best;
        }

        // 2. BROAD MATCH (ANY CARD allowed for this Merchant/Category)
        // If my HDFC card didn't match, maybe there's a generic "Visa" or "Any" offer?
        const broadQuery = `
            SELECT *, 'Standard Payment' as matched_card, 'Broad' as match_type
            FROM offers 
            WHERE 
                active = TRUE
                AND (LOWER(merchant) = $1 OR LOWER(category) = $2)
                AND LOWER(card_required) = 'any'
            ORDER BY discount_percentage DESC
            LIMIT 1
        `;

        result = await pool.query(broadQuery, [merch, cat, amt]);

        if (result.rows.length > 0) {
            console.log(`[OfferService] BROAD Match Found: ${result.rows[0].title}`);
            return result.rows[0];
        }

        // 3. GENERAL FALLBACK (Just show *something* active, e.g. "1% Cashback on everything")
        // This prevents "No Offer" screens if we have a generic catch-all offer
        const fallbackQuery = `
            SELECT *, 'Standard Payment' as matched_card, 'Fallback' as match_type
            FROM offers 
            WHERE active = TRUE 
            AND LOWER(card_required) = 'any'
            ORDER BY discount_percentage DESC 
            LIMIT 1
        `;

        result = await pool.query(fallbackQuery, [amt]);

        if (result.rows.length > 0) {
            console.log(`[OfferService] FALLBACK Match Found: ${result.rows[0].title}`);
            return result.rows[0];
        }

        console.log("[OfferService] No match found at all.");
        return null;

    } catch (error) {
        console.error("[OfferService] Error:", error);
        throw error;
    }
};

export const findBestStrictOffer = findBestOfferWaterfall; // Alias for backward compatibility if needed, but we should update caller.

export const calculateSavings = (offer, amount) => {
    if (!offer) return 0;
    let savings = (amount * offer.discount_percentage) / 100;

    // Cap at amount
    if (savings > amount) savings = amount;

    return savings;
};
