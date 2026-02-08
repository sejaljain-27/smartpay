
import 'dotenv/config';

async function verifyPayFinal() {
    try {
        console.log("1. Authenticating...");
        // Authenticate (Login or Signup)
        let token;
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test.pay@example.com", password: "password123" })
        });

        if (loginRes.ok) {
            token = (await loginRes.json()).token;
            console.log("Logged in.");
        } else {
            console.log("Login failed found, creating user...");
            const signupRes = await fetch('http://localhost:3000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: "test.pay@example.com", password: "password123", name: "Pay Tester" })
            });
            token = (await signupRes.json()).token;
            console.log("Signed up.");
        }

        if (!token) throw new Error("Could not get token");

        console.log("2. Testing /offers/use...");
        const payload = {
            amount: 1000,
            category: "Dining & Restaurants",
            merchant: "Final Verification Hotel",
            card_name: "HDFC Regalia",
            offer_id: "FINAL_TEST",
            savings: 100
        };

        const payRes = await fetch('http://localhost:3000/offers/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const payData = await payRes.json();
        console.log("Pay Status:", payRes.status);

        if (payData.transaction) {
            console.log("SUCCESS: Transaction ID:", payData.transaction.id);
            console.log("Final Amount (Should be -900):", payData.transaction.amount);
            console.log("Text:", payData.transaction.text);
        } else {
            console.error("FAILURE:", payData);
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

verifyPayFinal();
