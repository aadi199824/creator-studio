import { NextResponse } from "next/server";

import { PushService } from "@/lib/services/push.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/push/test — sends a test notification to the signed-in user's
 * own devices (Settings → "Send test notification").
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!PushService.isConfigured()) {
    return NextResponse.json(
      { error: "Phone notifications aren't set up on the server yet (VAPID keys are missing in Vercel)." },
      { status: 503 }
    );
  }

  const delivered = await PushService.sendToUser(user.id, {
    title: "✅ Creator Studio notifications work",
    body: "You'll get your draft approvals here at 10 AM IST.",
    url: "/dashboard/content",
    tag: "test",
  });

  if (delivered === 0) {
    return NextResponse.json(
      { error: "No device received it. Turn notifications off and on again on this phone, then retry." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, delivered });
}
