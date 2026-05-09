self.addEventListener("push", (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { body: event.data.text() };
        }
    }

    const title = data.title || "Bank Inner Core";
    const options = {
        body: data.body || "New notification",
        icon: data.icon || "/favicon.svg",
        badge: "/favicon.svg",
<<<<<<< HEAD
        requireInteraction: true,
=======
        vibrate: [100, 50, 100],
>>>>>>> e4f8b24e3e2299031686f4ca80c2b0442b8400a1
        data: {
            url: data.url || "/",
            token: data.token, // Payment request token
            notificationId: data.notificationId
        },
        actions: data.actions || [] // [{ action: 'approve', title: 'Approve' }, { action: 'decline', title: 'Decline' }]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();

    if (action === 'approve' || action === 'decline') {
        // Background API call
        const token = data.token;
        if (!token) return;

        event.waitUntil(
            fetch(`/api/payment-requests/${token}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action }),
                credentials: 'include' // Important to send cookies if available
            })
            .then(response => response.json())
            .then(result => {
                // Optionally show a confirmation notification
                const title = action === 'approve' ? 'Payment Approved' : 'Payment Declined';
                const body = result.success 
                    ? (action === 'approve' ? 'The payment has been processed successfully.' : 'The payment request was declined.')
                    : `Error: ${result.message}`;
                
                return self.registration.showNotification(title, {
                    body,
                    icon: "/favicon.svg",
                    tag: 'action-result'
                });
            })
            .catch(err => {
                console.error("Background action failed:", err);
                return self.registration.showNotification("Action Failed", {
                    body: "Could not process your response in the background.",
                    icon: "/favicon.svg"
                });
            })
        );
    } else {
        // Normal click (open app)
        const urlToOpen = data.url || "/";

        event.waitUntil(
            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then((windowClients) => {
                let matchingClient = null;
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) || client.url.includes("bank-inner-core")) {
                        matchingClient = client;
                        break;
                    }
                }

                if (matchingClient) {
                    matchingClient.focus();
                    if (urlToOpen && !matchingClient.url.includes(urlToOpen)) {
                        matchingClient.navigate(urlToOpen);
                    }
                } else {
                    clients.openWindow(urlToOpen);
                }
            })
        );
    }
});
