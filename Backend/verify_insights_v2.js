
import 'dotenv/config';
import pool from './db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const API_URL = 'http://localhost:3000';
const LOG_FILE = 'verification_v2.txt';

function log(msg) { try { fs.appendFileSync(LOG_FILE, msg + '\n'); } catch (e) { } }

async function run() {
    fs.writeFileSync(LOG_FILE, 'Starting v2 test...\n');
    try {
        const email = `test_v2_${Date.now()}@example.com`;
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET missing');

        // 1. Create User
        const res = await pool.query(
            "INSERT INTO users (email, password, name, is_verified) VALUES ($1, 'hash', 'V2 User', true) RETURNING id",
            [email]
        );
        const userId = res.rows[0].id;
        const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });
        log('User created and token generated');

        // 2. Add Transactions
        // Expense
        let r = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 100, text: 'Expense', type: 'debited', category: 'Food' })
        });
        if (!r.ok) {
            const txt = await r.text();
            log(`Expense failed: ${r.status} ${txt}`);
            throw new Error('Expense failed');
        }
        else log('Expense added');

        // Income
        r = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 300, text: 'Income', type: 'credited', category: 'Salary' })
        });
        if (!r.ok) {
            const txt = await r.text();
            log(`Income failed: ${r.status} ${txt}`);
            throw new Error('Income failed');
        }
        else log('Income added');

        // 3. Verify
        r = await fetch(`${API_URL}/insights/savings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await r.json();
        log(`Savings: ${JSON.stringify(data)}`);

        if (Number(data.totalSavings) === 200) log('SUCCESS');
        else log('FAILURE: Savings mismatch');

    } catch (e) {
        log(`Error: ${e.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
