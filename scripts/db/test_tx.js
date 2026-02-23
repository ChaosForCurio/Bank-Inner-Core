const baseUrl = 'http://localhost:5000/api';

async function test() {
    try {
        console.log("Testing POST /transaction...");
        const res = await fetch(`${baseUrl}/transaction`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fromAccount: "acc_1",
                toAccount: "acc_2",
                amount: 100,
                type: "transfer",
                idempotencyKey: `tx_${Date.now()}`
            })
        });

        console.log("Status:", res.status);
        const data = await res.text();
        console.log("Data:", data);
    } catch (error) {
        console.log("Fetch Error:", error.message);
    }
}
test();
