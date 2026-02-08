
import 'dotenv/config';

async function run() {
    console.log("--- START TEST ---");
    const email = `test.${Date.now()}@test.com`;
    console.log("Email:", email);

    // SIGNUP
    try {
        const r1 = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password', name: 'Test' })
        });

        console.log("Signup Status:", r1.status);
        if (!r1.ok) {
            console.log("Signup Text:", await r1.text());
            return;
        }

        const d1 = await r1.json();
        const token = d1.token;
        console.log("Token obtained");

        // TEST 150
        console.log("Testing 150...");
        const r2 = await fetch('http://localhost:3000/offers/best', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount: 150, category: 'dining' })
        });
        const d2 = await r2.json();
        console.log("Response 150:", JSON.stringify(d2));

        // TEST 200
        console.log("Testing 200...");
        const r3 = await fetch('http://localhost:3000/offers/best', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount: 200, category: 'dining' })
        });
        const d3 = await r3.json();
        console.log("Response 200:", JSON.stringify(d3));

    } catch (e) {
        console.error("ERROR:", e);
    }
    console.log("--- END TEST ---");
}

run();
