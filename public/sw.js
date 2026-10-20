/*
 * Creator Studio service worker — phone notifications only (no offline
 * caching). Registered from Settings → Phone notifications.
 *
 * Payload (from lib/services/push.service.ts):
 *   { title, body, url, image?, tag? }
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Creator Studio", body: event.data ? event.data.text() : "" };
  }

  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    data: { url: data.url || "/dashboard/content" },
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    requireInteraction: true,
  };
  if (data.image) options.image = data.image;

  event.waitUntil(self.registration.showNotification(data.title || "Creator Studio", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard/content", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "navigate" in client) {
          try {
            const navigated = await client.navigate(target);
            if (navigated) return navigated.focus();
          } catch {
            // Not controlled by this worker — open a new window instead.
          }
          break;
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});
