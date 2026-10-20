import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST   /api/push/subscribe  { subscription: PushSubscriptionJSON }
 * DELETE /api/push/subscribe  { endpoint: string }
 *
 * Saves / removes this phone's push subscription for the signed-in user.
 * Uses the session client, so RLS limits every row to its owner.
 */

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().startsWith("https://").max(1000),
    keys: z.object({
      p256dh: z.string().min(1).max(200),
      auth: z.string().min(1).max(100),
    }),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "This browser sent an invalid notification subscription." }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data.subscription;
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Saving push subscription failed:", error.message);
    return NextResponse.json(
      { error: "We couldn't save notifications for this device. If another account uses this browser, sign out of it there first." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });

  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
