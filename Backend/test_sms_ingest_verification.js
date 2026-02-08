
import fetch from 'node-fetch';

async function testIngest() {
    const payload = {
        amount: '12',
        type: 'credit',
        mode: 'OTHER',
        merchant: 'PRAMILA DINESH RANKA',
        rawText: 'Dear SBI User, your A/c X0201-credited by Rs.12 on 08Feb26 transfer from PRAMILA DINESH RANKA Ref No 603927631516 -SBI',
        direction: 'CREDIT',
        bankName: 'SBI',
        availableBalance: '5000.00',
        user_id: 1
    };

    try {
        const res = await fetch('http://localhost:3000/sms/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (res.status === 200 && data.status === 'saved') {
            console.log(" SMS Ingestion Test Passed");
        } else {
            console.error("SMS Ingestion Test Failed");
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

testIngest();
