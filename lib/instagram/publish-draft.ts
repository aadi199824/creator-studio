import type { SupabaseClient } from "@supabase/supabase-js";

import { buildInstagramCaption } from "@/lib/instagram/caption";
import { publishInstagramImage } from "@/lib/instagram/publisher";

/**
 * Publishes one ai_generations draft to its Instagram account and records
 * the result. Used by "Publish Now" in the Content Library and the phone approval
 * page (both via /api/content/:id/publish with the user's session client).
 *
 * The account lookup is always scoped to the draft's own user_id, so a draft
 * can never be published to someone else's connected account.
 */

export class PublishDraftError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export type PublishableDraft = {
  id: string;
  user_id: string;
  image_url: string | null;
  generated_content: string | null;
  social_account_id: string | null;
};

export async function publishDraft(
  supabase: SupabaseClient,
  draft: PublishableDraft,
  accountIdOverride?: string
): Promise<{ mediaId: string; accountName: string | null }> {
  if (!draft.image_url) {
    throw new PublishDraftError(
      'This draft has no image yet. Click Edit, upload one under "Post image", then publish.',
      400
    );
  }

  const accountId = accountIdOverride || draft.social_account_id;
  if (!accountId) {
    throw new PublishDraftError(
      "No Instagram account is associated with this draft. Choose which connected account to publish to.",
      400
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", draft.user_id)
    .eq("platform", "instagram")
    .single();

  if (accountError || !account) {
    throw new PublishDraftError("That Instagram account is not connected to your account.", 404);
  }

  const caption = buildInstagramCaption(draft.generated_content ?? "");

  try {
    const mediaId = await publishInstagramImage(
      account.account_id,
      account.access_token,
      draft.image_url,
      caption,
      account.auth_provider ?? "instagram_direct"
    );

    await supabase.from("published_posts").insert({
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
      .eq("id", draft.id)
      .eq("user_id", draft.user_id);

    return { mediaId, accountName: account.account_name ?? null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't publish this post to Instagram. Please reconnect your account and try again.";

    await supabase
      .from("ai_generations")
      .update({ publish_error: message })
      .eq("id", draft.id)
      .eq("user_id", draft.user_id);

    throw new PublishDraftError(message, 500);
  }
}
