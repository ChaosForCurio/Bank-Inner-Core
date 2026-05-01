const axios = require('axios');

const baseURL = 'http://localhost:5000/api/';
const api = axios.create({ baseURL });

console.log('Testing URL resolution:');

// Simulated request to see how Axios resolves URLs
const testPath = '/api/vaults';
console.log(`Base URL: ${baseURL}`);
console.log(`Request Path: ${testPath}`);

// We can't easily see the final URL without making a request, 
// but we can look at the config in a mock adapter or just assume the standard behavior.
// Actually, axios's buildURL helper is what we want.

const buildFullPath = (baseUrl, relativeUrl) => {
  if (baseUrl && !relativeUrl.startsWith('http')) {
    return baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '');
  }
  return relativeUrl;
};

console.log(`Resolved URL (manual logic): ${buildFullPath(baseURL, testPath)}`);

// Let's try to actually make a request to a non-existent local port to see the error message which often contains the URL
api.get(testPath).catch(err => {
    if (err.config) {
        console.log(`Axios resolved URL: ${err.config.url}`);
        // Wait, Axios config.url is usually the relative one. 
        // We need to look at the internal request object if available.
    }
});
