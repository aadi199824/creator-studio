import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publishInstagramImage } from "@/lib/instagram/publisher";
import { buildInstagramCaption } from "@/lib/instagram/caption";

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

  if (!content.image_url) {
    return NextResponse.json(
      {
        error:
          "This draft has no image yet. Add one (Edit) before publishing.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const accountId: string | undefined =
    body?.accountId || content.social_account_id || undefined;

  if (!accountId) {
    return NextResponse.json(
      {
        error:
          "No Instagram account is associated with this draft. Pass an accountId to choose which connected account to publish to.",
      },
      { status: 400 }
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { error: "That Instagram account is not connected to your account." },
      { status: 404 }
    );
  }

  const caption = buildInstagramCaption(content.generated_content ?? "");

  try {
    const mediaId = await publishInstagramImage(
      account.account_id,
      account.access_token,
      content.image_url,
      caption,
      account.auth_provider ?? "instagram_direct"
    );

    await supabase
      .from("published_posts")
      .insert({
        user_id: user.id,
        social_account_id: account.id,
        platform: "instagram",
        media_id: mediaId,
        image_url: content.image_url,
        caption,
        status: "published",
      });

    await supabase
      .from("ai_generations")
      .update({ status: "published", publish_error: null })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, mediaId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't publish this post to Instagram. Please reconnect your account and try again.";

    await supabase
      .from("ai_generations")
      .update({ publish_error: message })
      .eq("id", id)
      .eq("user_id", user.id);

    console.error("Publish Now failed:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
