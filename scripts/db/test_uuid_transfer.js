const fs = require('fs');
async function testUUIDTransfer() {
    let log = '';
    try {
        log += "Logging in as testuser...\n";
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser@example.com',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            log += `Login failed: ${JSON.stringify(loginData)}\n`;
            fs.writeFileSync('test_uuid_transfer.log', log);
            return;
        }

        const token = loginData.token;
        log += "Login successful! Token: " + token.substring(0, 20) + "...\n";

        log += "Executing transfer to UUID...\n";
        const transferRes = await fetch('http://localhost:5000/api/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fromAccount: '3', // testuser's account
                toUserUuid: '1260635e-d7fc-464b-b8be-c68c94570298', // system bank UUID
                amount: 50,
                type: 'TRANSFER',
                idempotencyKey: 'test-uuid-transfer-' + Date.now()
            })
        });

        const transferData = await transferRes.json();
        log += `Transfer Response (${transferRes.status}): ${JSON.stringify(transferData)}\n`;
        fs.writeFileSync('test_uuid_transfer.log', log);
    } catch (error) {
        log += `Transfer failed with exception: ${error}\n`;
        fs.writeFileSync('test_uuid_transfer.log', log);
    }
}

testUUIDTransfer();
