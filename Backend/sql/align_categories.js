
import 'dotenv/config';
import pool from '../db.js';

async function alignData() {
    try {
        console.log("Starting data alignment...");

        // 1. Align Categories
        const catMap = {
            'Dining & Restaurants': ['Food', 'Dining', 'Food Delivery'], // Merge Food Delivery here
            'Utilities & Bills': ['Bill Payment', 'Recharge', 'Utility'],
            'Shopping': ['Shop', 'Shopping'],
            'Travel & Transport': ['Travel'],
            'OTT & Subscriptions': ['OTT', 'Entertainment'],
            'Healthcare & Wellness': ['Health', 'Healthcare'],
            'Education': ['Education'],
            'Online Services': ['Online']
        };

        for (const [newCat, oldCats] of Object.entries(catMap)) {
            console.log(`Updating categories ${oldCats.join(', ')} -> ${newCat}`);
            await pool.query(
                `UPDATE card_offers SET category = $1 WHERE category = ANY($2)`,
                [newCat, oldCats]
            );
        }

        // 2. Align Merchants (Generic Contexts)
        const merchMap = {
            'Restaurant Walk-in': ['Dining (Offline)', 'Partner Restaurants'], // Map offline dining to Walk-in
            'Retail Store': ['General Online Shopping', 'Shopping (All Merchants)'], // Approximate
            'Food Delivery': ['Food (All Merchants)']
        };

        for (const [newMerch, oldMerchs] of Object.entries(merchMap)) {
            console.log(`Updating merchants ${oldMerchs.join(', ')} -> ${newMerch}`);
            await pool.query(
                `UPDATE card_offers SET merchant = $1 WHERE merchant = ANY($2)`,
                [newMerch, oldMerchs]
            );
        }

        console.log("Data alignment complete.");
        await pool.end();

    } catch (e) {
        console.error("Migration failed:", e);
        await pool.end();
    }
}

alignData();
