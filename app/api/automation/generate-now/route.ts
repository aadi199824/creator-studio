import { NextRequest, NextResponse } from "next/server";

import { AUTOMATION_ACCOUNTS, type AutomationAccount } from "@/lib/automation/brand-profiles";
import { CSP_FORMATS, type CspFormat } from "@/lib/automation/csp-content";
import { generateForAccount } from "@/lib/automation/daily-generator";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const maxDuration = 300;

/**
 * POST /api/automation/generate-now
 * Body: { "account": "csp_officials" | "tradeverse.academy", "format"?: <csp format> }
 *
 * Lets a logged-in user create a draft on demand from the Content Library
 * (same pipeline as the daily cron). Authorization: the Instagram account
 * must belong to the current user — checked inside generateForAccount
 * before anything is generated. Never publishes.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again to generate posts." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { account?: unknown; format?: unknown } | null;
  const account = AUTOMATION_ACCOUNTS.find((handle) => handle === body?.account) as AutomationAccount | undefined;

  if (!account) {
    return NextResponse.json(
      { error: `Choose an account: ${AUTOMATION_ACCOUNTS.join(" or ")}.` },
      { status: 400 }
    );
  }

  let cspFormat: CspFormat | undefined;
  if (body?.format !== undefined && body.format !== null && body.format !== "") {
    if (!(CSP_FORMATS as readonly string[]).includes(String(body.format))) {
      return NextResponse.json({ error: `Unknown template "${String(body.format)}".` }, { status: 400 });
    }
    cspFormat = body.format as CspFormat;
  }

  try {
    const draft = await generateForAccount(account, { cspFormat, expectedUserId: user.id });
    return NextResponse.json({ success: true, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error(`generate-now failed for ${account}:`, message);

    const busy = message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand");
    return NextResponse.json(
      {
        error: busy
          ? "The AI writer is overloaded right now. Please try again in a few minutes."
          : `We couldn't create the post: ${message}`,
      },
      { status: busy ? 503 : 500 }
    );
  }
}
