
import 'dotenv/config';

// Simple login to get token
async function getToken() {
    try {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "test.offer@example.com",
                password: "password123"
            })
        });

        if (!res.ok) {
            console.log("Login failed, trying signup...");
            const signupRes = await fetch('http://localhost:3000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: "test.offer@example.com",
                    password: "password123",
                    name: "Test User"
                })
            });
            const signupData = await signupRes.json();
            return signupData.token;
        }

        const data = await res.json();
        return data.token;
    } catch (e) {
        console.error("Auth failed:", e);
        return null;
    }
}

async function verifyPay() {
    const token = await getToken();
    if (!token) return;

    try {
        console.log("Testing /offers/use endpoint...");
        const payload = {
            amount: 500,
            category: "Dining & Restaurants",
            merchant: "Swiggy Dineout",
            card_name: "HDFC Regalia",
            offer_id: "TEST_OFFER",
            savings: 50
        };

        const res = await fetch('http://localhost:3000/offers/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Response:", data);

        if (data.transaction) {
            console.log("SUCCESS: Transaction Created:", data.transaction.id);
            console.log("Amount:", data.transaction.amount); // Should be -450
        } else {
            console.log("FAILURE: No transaction returned");
        }

    } catch (e) {
        console.error("Pay test failed:", e);
    }
}

verifyPay();
