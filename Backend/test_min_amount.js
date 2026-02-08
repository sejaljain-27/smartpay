
import 'dotenv/config';

// Simple login to get token
async function getToken() {
    const randomEmail = `test.offer.${Date.now()}@example.com`;
    console.log(`Trying with email: ${randomEmail}`);

    try {
        const signupRes = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: randomEmail,
                password: "password123",
                name: "Test User"
            })
        });

        if (!signupRes.ok) {
            const errText = await signupRes.text();
            console.log(`Signup failed (Status: ${signupRes.status}): ${errText}`);
            return null;
        }

        const signupData = await signupRes.json();
        return signupData.token;

    } catch (e) {
        console.error("Auth failed:", e);
        return null;
    }
}

async function testAmount(token, amount) {
    console.log(`\nTesting Amount: ₹${amount}`);
    try {
        const payload = {
            amount: amount,
            category: "Dining & Restaurants",
            merchant: "Swiggy Dineout",
            paymentType: "credit_card"
        };

        const res = await fetch('http://localhost:3000/offers/best', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.hasOffer) {
            console.log(`[FAIL] Offer returned for ₹${amount} (Should be BLOCKED if < 200)`);
            console.log("Offer:", data.bestOffer.title || "Generic Offer");
        } else {
            if (amount < 200) {
                console.log(`[PASS] No offer for ₹${amount}. Message: ${data.message}`);
            } else {
                console.log(`[INFO] No offer for ₹${amount}. Message: ${data.message}`);
            }
        }

    } catch (e) {
        console.error(`Test failed for ${amount}:`, e.message);
    }
}

async function runTests() {
    console.log("Starting Minimum Amount Verification...");
    const token = await getToken();
    if (!token) {
        console.log("Could not get token. Aborting.");
        return;
    }

    // 1. Test Below Limit
    await testAmount(token, 150);

    // 2. Test Key Boundary
    await testAmount(token, 199);

    // 3. Test At Limit (Should Work if offers exist)
    await testAmount(token, 200);

    // 4. Test Above Limit
    await testAmount(token, 500);
}

runTests();
