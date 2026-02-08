
import 'dotenv/config';
import pool from '../db.js';

async function relaxMinAmount() {
    try {
        console.log("Relaxing min_amount constraints...");
        await pool.query("UPDATE card_offers SET min_amount = 0");
        console.log("All offers updated to min_amount = 0.");
        await pool.end();
    } catch (e) {
        console.error("Update failed:", e);
        await pool.end();
    }
}

relaxMinAmount();
