import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/content/:id/skip
 *
 * "Skip today" from the approval page: stops reminders for this draft. The
 * draft itself stays in the Content Library and can still be published.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_generations")
    .update({ skipped_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Skip draft failed:", error.message);
    return NextResponse.json({ error: "We couldn't skip this draft. Please try again." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "This draft was already published or isn't yours." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
