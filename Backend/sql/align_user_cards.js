
import 'dotenv/config';
import pool from '../db.js';

async function alignUserCards() {
    try {
        console.log("Starting User Cards Alignment...");

        // Normalize Banks in user_cards to match the offers we just fixed
        const bankMap = {
            'HDFC': ['HDFC Bank', 'HDFC Bank Credit Card', 'HDFC Bank Debit Card', 'HDFC PayZapp'], // Added PayZapp
            'SBI': ['SBI Card', 'SBI Bank'],
            'ICICI': ['ICICI Bank'],
            'Axis': ['Axis Bank'],
            'Kotak': ['Kotak Bank', 'Kotak Mahindra Bank'],
            'American Express': ['Amex', 'American Express Card']
        };

        for (const [targetBank, sources] of Object.entries(bankMap)) {
            await pool.query(
                `UPDATE user_cards SET bank = $1 WHERE bank = ANY($2)`,
                [targetBank, sources]
            );
            console.log(`Updated User Cards: ${sources.join(', ')} -> ${targetBank}`);
        }

        console.log("User Cards Alignment Complete.");
        await pool.end();

    } catch (e) {
        console.error("Alignment failed:", e);
        await pool.end();
    }
}

alignUserCards();
