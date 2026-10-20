import { NextRequest, NextResponse } from "next/server";

import { PublishDraftError, publishDraft } from "@/lib/instagram/publish-draft";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/content/:id/publish
 *
 * Manual "Publish Now" — publishes a draft's single generated image
 * immediately to Instagram. Requires the caller's own session; a user can
 * only publish their own content, to their own connected account.
 *
 * Body: { accountId?: string } — required only when the draft has no
 * social_account_id already attached (e.g. an older or manually-created
 * draft) and the caller has more than one connected Instagram account.
 *
 * The publishing itself lives in lib/instagram/publish-draft.ts; the phone
 * approval page (app/approve/[id]) calls this same route.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: content, error: contentError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const { mediaId } = await publishDraft(supabase, content, body?.accountId || undefined);
    return NextResponse.json({ success: true, mediaId });
  } catch (error) {
    const status = error instanceof PublishDraftError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Publishing failed.";
    if (status >= 500) console.error("Publish Now failed:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
