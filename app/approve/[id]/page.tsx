import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApproveActions } from "@/components/approve/approve-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * /approve/:id — opened from the 10 AM phone notification.
 *
 * Phone-sized review page for one draft: image, caption, Publish / Skip.
 * Requires the owner's session (signed-out users go to /login and come back
 * here); the draft query is scoped to the signed-in user.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/approve/${id}`)}`);

  const { data: draft } = await supabase
    .from("ai_generations")
    .select("id, topic, image_url, generated_content, status, publish_error, skipped_at, social_account_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!draft) notFound();

  let accountName: string | null = null;
  if (draft.social_account_id) {
    const { data: account } = await supabase
      .from("social_accounts")
      .select("account_name")
      .eq("id", draft.social_account_id)
      .eq("user_id", user.id)
      .maybeSingle();
    accountName = account?.account_name ?? null;
  }

  const isDraft = draft.status === "draft";

  return (
    <main className="mx-auto w-full max-w-lg space-y-4 bg-slate-50 p-4 pb-32">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {accountName ? `@${accountName.replace(/^@/, "")}` : "Instagram"} · waiting for your approval
        </p>
        <h1 className="text-xl font-bold leading-tight">{draft.topic || "Today's post"}</h1>
      </header>

      {draft.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public URL, shown as-is
        <img
          src={draft.image_url}
          alt={draft.topic ? `Post image: ${draft.topic}` : "Post image"}
          className="w-full rounded-xl border bg-white"
        />
      ) : (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
          This draft has no image yet. Add one from the Content Library (Edit → Post image) before
          publishing.
        </div>
      )}

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Caption</h2>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {draft.generated_content || "No caption."}
        </p>
      </section>

      {draft.publish_error && isDraft && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Last publish attempt failed: {draft.publish_error}
        </p>
      )}

      {isDraft ? (
        <ApproveActions draftId={draft.id} hasImage={Boolean(draft.image_url)} skipped={Boolean(draft.skipped_at)} />
      ) : (
        <p className="rounded-xl border bg-white p-4 text-sm">
          {draft.status === "published"
            ? "✅ This post is already published."
            : `This post is no longer a draft (status: ${draft.status}).`}{" "}
          <Link href="/dashboard/content" className="font-medium underline">
            Open Content Library
          </Link>
        </p>
      )}
    </main>
  );
}
