import 'dotenv/config';
import pool from './db.js';

async function verify() {
    const userId = 1;

    try {
        console.log("Cleaning up old test data...");
        await pool.query("DELETE FROM transactions WHERE text = 'Test SMS with Balance'");

        console.log("Inserting test transaction directly...");
        // Replicating the logic from sms.js partially
        const bankName = "HDFC BANK";
        const availableBalance = 15600.00;

        await pool.query(
            `INSERT INTO transactions
            (user_id, amount, text, type, category, bank_name, available_balance, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [userId, 1200, "Test SMS with Balance", "credited", "Others", bankName, availableBalance]
        );

        console.log("Insertion successful.");

        console.log("Verifying data in DB...");
        const res = await pool.query(
            `SELECT bank_name, available_balance FROM transactions 
             WHERE user_id = $1 AND available_balance = $2`,
            [userId, availableBalance]
        );

        if (res.rows.length > 0) {
            console.log("SUCCESS: Found row with", res.rows[0]);
        } else {
            console.error("FAILURE: Row not found. Schema might be missing columns.");
            process.exit(1);
        }

    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verify();
