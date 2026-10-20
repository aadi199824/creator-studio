"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings → Phone notifications.
 *
 * Registers /sw.js, asks for notification permission and saves this
 * device's push subscription (/api/push/subscribe). Each phone/browser is
 * enabled separately.
 */

type State =
  | "loading"
  | "unsupported"
  | "ios-install" // iPhone/iPad, not opened from the home screen
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return (body && typeof body.error === "string" && body.error) || fallback;
}

export function PhoneNotificationsCard() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        setState(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      setState(subscription ? "on" : "off");
    })().catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const keyResponse = await fetch("/api/push/public-key");
      if (!keyResponse.ok) {
        throw new Error(await readError(keyResponse, "Phone notifications aren't set up on the server yet."));
      }
      const { publicKey } = (await keyResponse.json()) as { publicKey: string };

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        toast.error("Notifications were not allowed on this device.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!response.ok) throw new Error(await readError(response, "We couldn't save this device."));

      setState("on");
      toast.success("Notifications are on for this device.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't turn on notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState("off");
      toast.success("Notifications are off for this device.");
    } catch {
      toast.error("We couldn't turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      if (!response.ok) throw new Error(await readError(response, "The test notification wasn't sent."));
      toast.success("Test sent — check your notifications.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The test notification wasn't sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone notifications</CardTitle>
        <CardDescription>
          Get each account&apos;s draft at 10 AM IST, with hourly reminders until 8 PM while it&apos;s
          still waiting for approval. Turn this on separately on each phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "loading" && <p className="text-sm text-muted-foreground">Checking this device…</p>}

        {state === "ios-install" && (
          <p className="text-sm text-muted-foreground">
            On iPhone, notifications only work from the home-screen app. In Safari, tap the Share button,
            choose <strong>Add to Home Screen</strong>, open Creator Studio from the new icon, sign in and
            come back to this page.
          </p>
        )}

        {state === "unsupported" && (
          <p className="text-sm text-muted-foreground">
            This browser doesn&apos;t support notifications. On Android use Chrome; on iPhone use Safari
            and add Creator Studio to the home screen (iOS 16.4 or newer).
          </p>
        )}

        {state === "denied" && (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked for this site. Allow them in this browser&apos;s site settings, then
            reload this page.
          </p>
        )}

        {state === "off" && (
          <Button onClick={enable} disabled={busy}>
            <Bell className="mr-2 h-4 w-4" />
            {busy ? "Turning on…" : "Turn on for this device"}
          </Button>
        )}

        {state === "on" && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={sendTest} disabled={busy}>
              <Send className="mr-2 h-4 w-4" />
              Send test notification
            </Button>
            <Button variant="outline" onClick={disable} disabled={busy}>
              <BellOff className="mr-2 h-4 w-4" />
              Turn off for this device
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
