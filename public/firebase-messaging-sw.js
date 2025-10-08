// Firebase Cloud Messaging Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize Firebase in the service worker
firebase.initializeApp({
  projectId: "tempo-certo-qf64u",
  appId: "1:1044295739285:web:d583b8dfdb56de33ec789c",
  storageBucket: "tempo-certo-qf64u.appspot.com",
  apiKey: "AIzaSyBCuaWiC3-tlpttDR_PBfGgKtFsKMflrK8",
  authDomain: "tempo-certo-qf64u.firebaseapp.com",
  messagingSenderId: "1044295739285",
});

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title || "Studify";
  const notificationOptions = {
    body: payload.notification.body || "You have a study reminder!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.type || "studify-notification",
    data: payload.data,
    actions: [
      {
        action: "open",
        title: "Open Studify",
        icon: "/favicon.ico",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: true,
    timestamp: Date.now(),
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click events
self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  if (event.action === "open" || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(function (clientList) {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (
              client.url.includes("localhost:9002") ||
              client.url.includes("studify")
            ) {
              return client.focus();
            }
          }

          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow("/dashboard");
          }
        })
    );
  }
});

// Handle push events (for custom data-only messages)
self.addEventListener("push", function (event) {
  if (event.data) {
    console.log(
      "[firebase-messaging-sw.js] Push event received:",
      event.data.text()
    );

    try {
      const payload = event.data.json();

      // Custom handling for data-only messages
      if (payload.data && !payload.notification) {
        const title = payload.data.title || "Studify Reminder";
        const options = {
          body: payload.data.body || "Time for your study session!",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: payload.data.type || "studify-reminder",
          data: payload.data,
          requireInteraction: true,
        };

        event.waitUntil(self.registration.showNotification(title, options));
      }
    } catch (error) {
      console.error(
        "[firebase-messaging-sw.js] Error processing push event:",
        error
      );
    }
  }
});
