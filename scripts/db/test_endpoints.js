const axios = require('axios');

async function testEndpoints() {
    const baseUrl = 'http://localhost:5000/api';
    const endpoints = [
        '/auth/me',
        '/account',
        '/transaction/history'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing GET ${baseUrl}${endpoint}...`);
            const res = await axios.get(`${baseUrl}${endpoint}`);
            console.log(`  Result: ${res.status}`);
        } catch (error) {
            console.log(`  Result: ${error.response ? error.response.status : error.message}`);
        }
    }
}

testEndpoints();
