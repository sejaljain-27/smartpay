import 'dotenv/config';
import pool from '../db.js';

async function migrate() {
    try {
        // Add bank_name column
        await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
    `);

        // Add available_balance column
        await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15, 2);
    `);

        console.log("Migration successful: added bank_name and available_balance columns.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
