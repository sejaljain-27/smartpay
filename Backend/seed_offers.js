import "dotenv/config";
import pool from "./db.js";

async function seed() {
    try {
        console.log("Initializing Offers Table...");

        // 1. Ensure Table Exists
        await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        discount_percentage NUMERIC DEFAULT 0,
        category TEXT,
        merchant TEXT,
        card_required TEXT,
        min_spend NUMERIC DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        console.log("Table 'offers' verified.");

        // 2. Check Count
        const countRes = await pool.query("SELECT COUNT(*) FROM offers");
        const count = parseInt(countRes.rows[0].count);
        console.log(`Current offers count: ${count}`);

        // 3. Insert if low
        if (count < 5) {
            console.log("Seeding initial offers...");
            await pool.query(`
            INSERT INTO offers (title, description, discount_percentage, category, merchant, card_required, min_spend, active)
            VALUES 
            ('Amazon HDFC Special', 'Flat 10% off on electronics', 10, 'shopping', 'amazon', 'HDFC', 500, true),
            ('Zomato Gold', '50% off up to ₹150', 50, 'dining', 'zomato', 'Any', 150, true),
            ('Uber Commuter', '5% cashback on all rides', 5, 'travel', 'uber', 'Titanium', 0, true),
            ('Myntra Fashion', '15% off on new arrivals', 15, 'shopping', 'myntra', 'Axis', 1000, true),
            ('Generic Cashback', '1% cashback on all spends', 1, 'general', 'any', 'Any', 0, true)
            ON CONFLICT DO NOTHING;
        `);
            console.log("Seeding completed.");
        } else {
            console.log("Offers already populated.");
        }

        // 4. Verify Content
        const dump = await pool.query("SELECT id, title, merchant, active FROM offers LIMIT 5");
        console.log("Sample Data:", dump.rows);

        process.exit(0);
    } catch (err) {
        console.error("FATAL SEED ERROR:", err);
        process.exit(1);
    }
}

seed();
