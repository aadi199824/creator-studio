import { NextRequest, NextResponse } from "next/server";

import { runDraftNotifications } from "@/lib/automation/draft-notifications";

export const maxDuration = 60;

/**
 * GET /api/notify/run
 *
 * Call this every hour from 10:00 to 20:00 IST (external scheduler such as
 * cron-job.org — Vercel Hobby crons only run once a day). Sends the 10:00
 * phone approval notification per account and hourly reminders while a
 * draft is still unpublished. Safe to call more often: it never sends two
 * pings for the same draft within 50 minutes, and does nothing outside
 * 10:00–20:59 IST.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDraftNotifications();
    if (!result.configured) {
      return NextResponse.json(
        { error: "Phone notifications are not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error("Draft notification run failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
