const EMAIL = "test@example.com";
const PASSWORD = "yourpassword";
const API_URL = "http://localhost:3000";

async function testScore() {
    try {
        console.log("Creating user...");
        const email = `test_score_${Date.now()}@example.com`;

        // 0. Create User (Register)
        const registerRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: PASSWORD, name: "Score Tester" })
        });

        if (!registerRes.ok) throw new Error(await registerRes.text());
        console.log("User created:", email);

        // 1. Login to get token
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: PASSWORD })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            throw new Error(`Login Failed: ${txt}`);
        }
        const { token } = await loginRes.json();
        console.log("Login successful.");

        // 2. Fetch Score
        const scoreRes = await fetch(`${API_URL}/insights/score`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!scoreRes.ok) {
            const txt = await scoreRes.text();
            throw new Error(`Score Fetch Failed: ${txt}`);
        }
        const scoreData = await scoreRes.json();

        console.log('SCORE RESULT:', JSON.stringify(scoreData, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testScore();
