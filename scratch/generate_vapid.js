const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('PUBLIC KEY:', vapidKeys.publicKey);
console.log('PRIVATE KEY:', vapidKeys.privateKey);
