/**
 * Web push (phone notifications) for Creator Studio — server only.
 *
 * Env:
 * - VAPID_PUBLIC_KEY   public key (the browser fetches it from /api/push/public-key)
 * - VAPID_PRIVATE_KEY  private key — server only, never sent to the browser
 * - VAPID_SUBJECT      optional "mailto:you@example.com" or https URL
 *
 * Generate the key pair once with:  npx web-push generate-vapid-keys
 *
 * Subscriptions are stored in public.push_subscriptions (one per phone /
 * browser). Expired ones (push service answers 404/410) are deleted.
 */

import webpush from "web-push";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  /** Page opened when the notification is tapped (same-origin path). */
  url: string;
  /** Large picture (Android/desktop Chrome; ignored on iPhone). */
  image?: string | null;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
};

type SubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

let configured: boolean | null = null;

/** Public VAPID key (NEXT_PUBLIC_ name still accepted for older setups). */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

function configure(): boolean {
  if (configured !== null) return configured;

  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return configured;
  }

  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://creator-studio-khaki.vercel.app";

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return configured;
}

export class PushService {
  static isConfigured(): boolean {
    return configure();
  }

  /**
   * Sends to every device the user enabled. Returns how many devices
   * accepted it (0 = the user has no working device subscribed).
   */
  static async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!configure()) return 0;

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error) {
      console.error("Could not load push subscriptions:", error.message);
      return 0;
    }

    const rows = (data ?? []) as SubscriptionRow[];
    let delivered = 0;

    await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify(payload),
            { TTL: 60 * 60, urgency: "high", topic: payload.tag?.slice(0, 32).replace(/[^A-Za-z0-9_-]/g, "") }
          );
          delivered += 1;
          await supabase
            .from("push_subscriptions")
            .update({ last_success_at: new Date().toISOString() })
            .eq("id", row.id);
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // The phone unsubscribed or the browser data was cleared.
            await supabase.from("push_subscriptions").delete().eq("id", row.id);
          } else {
            console.error(
              `Push to subscription ${row.id} failed (${statusCode ?? "network"}):`,
              err instanceof Error ? err.message : err
            );
          }
        }
      })
    );

    return delivered;
  }
}
