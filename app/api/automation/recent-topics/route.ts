import { NextRequest, NextResponse } from "next/server";

import {
  findAccountByInstagramUsername,
  verifyAutomationSecret,
} from "@/lib/services/automation.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * GET /api/automation/recent-topics?instagram_username=csp_officials
 *
 * Lets the daily automation check what's already been posted/drafted
 * recently for a given account, so it can avoid repeating a topic — per the
 * brand brief's explicit "do not repeat recent topics" requirement.
 */
export async function GET(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = request.nextUrl.searchParams.get("instagram_username");

  if (!username) {
    return NextResponse.json(
      { error: "instagram_username is required." },
      { status: 400 }
    );
  }

  const { account, error: lookupError } =
    await findAccountByInstagramUsername(username);

  if (lookupError || !account) {
    return NextResponse.json(
      {
        error: `No connected Instagram account matching "${username}" was found.`,
      },
      { status: 404 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .select("topic, created_at")
    .eq("user_id", account.user_id)
    .eq("platform", "instagram")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json(
      { error: "Could not load recent topics." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    topics: (data ?? []).map((row) => row.topic).filter(Boolean),
  });
}
