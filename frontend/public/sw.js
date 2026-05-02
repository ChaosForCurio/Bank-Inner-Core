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
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            let matchingClient = null;
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) || client.url.includes("bank-inner-core")) {
                    matchingClient = client;
                    break;
                }
            }

            if (matchingClient) {
                // Return to an existing open browser tab
                matchingClient.focus();
                // Optionally navigate the client
                if (urlToOpen && !matchingClient.url.includes(urlToOpen)) {
                    matchingClient.navigate(urlToOpen);
                }
            } else {
                // If no window is open, open a new one
                clients.openWindow(urlToOpen);
            }
        })
    );
});
