/**
 * Phone notifications for the daily automation drafts.
 *
 * runDraftNotifications() is called hourly (10:00–20:00 IST) by an external
 * scheduler via /api/notify/run. For each automation account it sends the
 * first notification at the first run from 10:00 IST, then a reminder at
 * every later run while the draft is still unpublished and not skipped.
 *
 * Tapping a notification opens /approve/<draft id> in Creator Studio, where
 * the owner (signed in) reviews the post and taps Publish or Skip. The
 * notification itself never publishes anything.
 */

import { AUTOMATION_ACCOUNTS } from "@/lib/automation/brand-profiles";
import { findAccountByInstagramUsername } from "@/lib/services/automation.service";
import { PushService } from "@/lib/services/push.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const FIRST_NOTIFICATION_HOUR = 10; // 10:00 IST
const LAST_REMINDER_HOUR = 20; // 20:00 IST
/** Guard against double reminders if the scheduler fires twice in an hour. */
const MIN_REMINDER_GAP_MS = 50 * 60 * 1000;
/** Only drafts created in the last day count as "today's" draft. */
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const DRAFT_COLUMNS =
  "id, user_id, topic, image_url, status, created_at, notified_at, last_reminded_at, reminder_count";

type DraftRow = {
  id: string;
  user_id: string;
  topic: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
  notified_at: string | null;
  last_reminded_at: string | null;
  reminder_count: number | null;
};

function istHour(now: Date): number {
  return new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
}

export type NotificationRunResult = {
  account: string;
  action: "notified" | "reminded" | "no_draft" | "waiting" | "no_device" | "skipped_window" | "account_missing";
  draft_id?: string;
};

export async function runDraftNotifications(now: Date = new Date()): Promise<{
  configured: boolean;
  ist_hour: number;
  results: NotificationRunResult[];
}> {
  const hour = istHour(now);
  if (!PushService.isConfigured()) return { configured: false, ist_hour: hour, results: [] };

  if (hour < FIRST_NOTIFICATION_HOUR || hour > LAST_REMINDER_HOUR) {
    return {
      configured: true,
      ist_hour: hour,
      results: AUTOMATION_ACCOUNTS.map((account) => ({ account, action: "skipped_window" as const })),
    };
  }

  const supabase = createAdminSupabaseClient();
  const results: NotificationRunResult[] = [];

  for (const username of AUTOMATION_ACCOUNTS) {
    const { account } = await findAccountByInstagramUsername(username);
    if (!account) {
      results.push({ account: username, action: "account_missing" });
      continue;
    }

    const { data: draftData } = await supabase
      .from("ai_generations")
      .select(DRAFT_COLUMNS)
      .eq("social_account_id", account.id)
      .eq("status", "draft")
      .is("skipped_at", null)
      .gte("created_at", new Date(now.getTime() - DRAFT_MAX_AGE_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const draft = draftData as DraftRow | null;

    if (!draft) {
      // Only warn once, on the 10:00 run, if today's draft never got created.
      if (hour === FIRST_NOTIFICATION_HOUR) {
        await PushService.sendToUser(account.user_id, {
          title: `@${username}: no draft today`,
          body: "It may already be published, or today's generation failed. Tap to create one in the Content Library.",
          url: "/dashboard/content",
          tag: `nodraft-${username}`,
        });
      }
      results.push({ account: username, action: "no_draft" });
      continue;
    }

    const isFirst = !draft.notified_at;

    if (!isFirst) {
      const lastPing = new Date(draft.last_reminded_at ?? draft.notified_at!).getTime();
      if (now.getTime() - lastPing < MIN_REMINDER_GAP_MS) {
        results.push({ account: username, action: "waiting", draft_id: draft.id });
        continue;
      }
    }

    const hasImage = Boolean(draft.image_url);
    const topic = draft.topic?.trim() || "Today's post";
    const remindersSent = (draft.reminder_count ?? 0) + (isFirst ? 0 : 1);
    const finalReminder = !isFirst && hour === LAST_REMINDER_HOUR;

    const delivered = await PushService.sendToUser(draft.user_id, {
      title: isFirst ? `🔔 @${username}: today's draft is ready` : `⏰ @${username}: draft still pending`,
      body: isFirst
        ? `${topic}\n${hasImage ? "Tap to review and publish." : "It needs an image before it can be published."}`
        : `Hi, this post is still pending. Please approve it so your draft can be published.\n${topic}` +
          (finalReminder ? "\nThis is today's last reminder." : ""),
      url: `/approve/${draft.id}`,
      image: draft.image_url,
      // Same tag per draft: a reminder replaces the previous notification.
      tag: `draft-${draft.id}`,
    });

    if (delivered === 0) {
      // Nothing was delivered — don't mark it, so the next run tries again.
      results.push({ account: username, action: "no_device", draft_id: draft.id });
      continue;
    }

    await supabase
      .from("ai_generations")
      .update(
        isFirst
          ? { notified_at: now.toISOString(), last_reminded_at: now.toISOString() }
          : { reminder_count: remindersSent, last_reminded_at: now.toISOString() }
      )
      .eq("id", draft.id);

    results.push({ account: username, action: isFirst ? "notified" : "reminded", draft_id: draft.id });
  }

  return { configured: true, ist_hour: hour, results };
}
