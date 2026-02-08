
import fs from 'fs';

const API_URL = 'http://localhost:3000';
const LOG_FILE = 'verification_result.txt';

function log(msg) {
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (e) { }
}

async function test() {
    try {
        fs.writeFileSync(LOG_FILE, 'Starting test...\n');

        const email = `test_insights_${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'Insights User';

        // 1. Signup
        let res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        if (!res.ok) throw new Error('Signup failed');
        const authData = await res.json();
        const token = authData.token;
        log('Signup success');

        // 2. Add Transactions
        log('Adding transactions...');
        // Expense
        res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 100, text: 'Expense Tx', type: 'debited', category: 'Food' })
        });
        log(`Expense response status: ${res.status}`);
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Add expense failed: ${res.status} ${txt}`);
        }
        log('Expense added');

        // Income
        res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 300, text: 'Income Tx', type: 'credited', category: 'Salary' })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Add income failed: ${res.status} ${txt}`);
        }
        log('Income added');

        // 3. Verify Insights
        log('Verifying insights...');

        // Total Expense
        res = await fetch(`${API_URL}/insights/total`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let data = await res.json();
        log(`Total Expense: ${JSON.stringify(data)}`);
        if (Number(data.totalExpense) !== 100) throw new Error('Total Expense mismatch');

        // Total Savings (300 - 100 = 200)
        res = await fetch(`${API_URL}/insights/savings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await res.json();
        log(`Total Savings: ${JSON.stringify(data)}`);
        if (Number(data.totalSavings) !== 200) throw new Error('Total Savings mismatch');

        log('Verification Success!');

    } catch (err) {
        log(`Test Failed: ${err.message}`);
        process.exit(1);
    }
}

test();
