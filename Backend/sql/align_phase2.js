
import 'dotenv/config';
import pool from '../db.js';

async function alignPhase2() {
    try {
        console.log("Starting Phase 2 Alignment...");

        // 1. Fix Categories (Catching stragglers based on screenshot)
        // Screenshot showed 'Food & Dining'. Frontend wants 'Dining & Restaurants'.
        await pool.query(
            "UPDATE card_offers SET category = 'Dining & Restaurants' WHERE category = 'Food & Dining' OR category = 'Food' OR category = 'Dining'"
        );
        console.log("Updated Categories: Food & Dining, Food, Dining -> Dining & Restaurants");

        // 2. Fix Banks (Aligning card_offers matching user_cards)
        // User cards typically store 'HDFC', 'SBI', 'ICICI'.
        // Offers often have 'HDFC Bank', 'SBI Card', etc.
        const bankMap = {
            'HDFC': ['HDFC Bank', 'HDFC Bank Credit Card', 'HDFC Bank Debit Card'],
            'SBI': ['SBI Card', 'SBI Bank'],
            'ICICI': ['ICICI Bank'],
            'Axis': ['Axis Bank'],
            'Kotak': ['Kotak Bank', 'Kotak Mahindra Bank'],
            'American Express': ['Amex', 'American Express Card']
        };

        for (const [targetBank, sources] of Object.entries(bankMap)) {
            await pool.query(
                `UPDATE card_offers SET bank = $1 WHERE bank = ANY($2)`,
                [targetBank, sources]
            );
            console.log(`Updated Banks: ${sources.join(', ')} -> ${targetBank}`);
        }

        console.log("Phase 2 Alignment Complete.");
        await pool.end();

    } catch (e) {
        console.error("Alignment failed:", e);
        await pool.end();
    }
}

alignPhase2();
