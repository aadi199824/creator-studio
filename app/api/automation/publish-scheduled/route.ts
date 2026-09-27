import { NextRequest, NextResponse } from "next/server";

import { publishInstagramImage } from "@/lib/instagram/publisher";
import { buildInstagramCaption } from "@/lib/instagram/caption";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

// IMPORTANT — Vercel Hobby plan limitation (verified against Vercel's own
// docs, not assumed): Hobby-plan cron jobs can only run ONCE PER DAY, with
// an imprecise ±59 minute window. This route is designed around that: it
// does not try to fire "at 2:30pm" precisely — it runs once daily and
// publishes anything whose scheduled_at has already passed. A post
// scheduled for "today at 2:30pm" will actually go out sometime during
// this route's one daily run, not at exactly 2:30pm. Precise per-minute
// scheduling requires upgrading to Vercel's Pro plan and changing the cron
// expression in vercel.json.

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  return (
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: dueDrafts, error: queryError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("status", "scheduled")
    .eq("platform", "instagram")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (queryError) {
    console.error("publish-scheduled: failed to query due drafts:", queryError);

    return NextResponse.json(
      { error: "Could not query scheduled content." },
      { status: 500 }
    );
  }

  const published: Array<{ id: string; media_id: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const draft of dueDrafts ?? []) {
    try {
      if (!draft.image_url) {
        throw new Error(
          "No image attached to this draft — cannot auto-publish. Add an image and use Publish Now instead."
        );
      }

      if (!draft.social_account_id) {
        throw new Error(
          "No Instagram account is associated with this draft — cannot auto-publish. Use Publish Now and choose an account instead."
        );
      }

      const { data: account, error: accountError } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("id", draft.social_account_id)
        .eq("platform", "instagram")
        .single();

      if (accountError || !account) {
        throw new Error(
          "The Instagram account linked to this draft is no longer connected."
        );
      }

      const caption = buildInstagramCaption(draft.generated_content ?? "");

      const mediaId = await publishInstagramImage(
        account.account_id,
        account.access_token,
        draft.image_url,
        caption,
        account.auth_provider ?? "instagram_direct"
      );

      await supabase
        .from("published_posts")
        .insert({
          user_id: draft.user_id,
          social_account_id: account.id,
          platform: "instagram",
          media_id: mediaId,
          image_url: draft.image_url,
          caption,
          status: "published",
        });

      await supabase
        .from("ai_generations")
        .update({ status: "published", publish_error: null })
        .eq("id", draft.id);

      published.push({ id: draft.id, media_id: mediaId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown publish error.";

      console.error(`publish-scheduled: failed for draft ${draft.id}:`, message);

      await supabase
        .from("ai_generations")
        .update({ status: "failed", publish_error: message })
        .eq("id", draft.id);

      failed.push({ id: draft.id, error: message });
    }
  }

  return NextResponse.json({
    success: failed.length === 0,
    published,
    failed,
    checked_at: new Date().toISOString(),
  });
}
