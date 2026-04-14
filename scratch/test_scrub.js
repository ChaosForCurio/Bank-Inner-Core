require("dotenv").config();
const { scrubSensitiveData } = require("../src/utils/audit.logger");

const testData = {
    userId: 1,
    action: "password_change",
    metadata: {
        oldPassword: "super-secret-password",
        newPassword: "new-super-secret-password",
        somethingElse: "keep-this"
    }
};

const scrubbed = scrubSensitiveData(testData);

console.log("Original Data:", JSON.stringify(testData, null, 2));
console.log("Scrubbed Data:", JSON.stringify(scrubbed, null, 2));

const hasPassword = JSON.stringify(scrubbed).toLowerCase().includes("secret-password");
if (hasPassword) {
    console.error("FAIL: Sensitive data found in scrubbed output!");
    process.exit(1);
} else {
    console.log("SUCCESS: Sensitive data scrubbed correctly.");
}
