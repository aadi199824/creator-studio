import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Shared helpers for the daily-draft automation endpoints
 * (app/api/automation/*). These endpoints are called by a scheduled,
 * unattended process (not a logged-in browser session), so they authenticate
 * via a shared secret instead of a Supabase session, then resolve the
 * correct user server-side from the Instagram handle — the caller never
 * supplies a user_id directly.
 */

export function verifyAutomationSecret(request: Request): boolean {
  const provided = request.headers.get("x-automation-secret");
  const expected = process.env.AUTOMATION_SECRET;

  return Boolean(expected) && provided === expected;
}

export async function findAccountByInstagramUsername(username: string) {
  const supabase = createAdminSupabaseClient();
  const normalized = username.replace(/^@/, "").trim();

  const { data: account, error } = await supabase
    .from("social_accounts")
    .select("id, user_id, account_name, platform")
    .eq("platform", "instagram")
    .ilike("account_name", `%${normalized}%`)
    .limit(1)
    .maybeSingle();

  if (error || !account) {
    return { account: null, error: error ?? new Error("Account not found") };
  }

  // Best-effort brand match — brands are optional, so we don't fail the
  // whole draft if nothing matches.
  //
  // ROOT CAUSE (fixed here): this used to ILIKE the brand name against the
  // raw handle (e.g. "tradeverse.academy"). A human-readable brand name
  // like "TradeVerse Academy" has a space where the handle has a literal
  // "." — and "." is not a SQL wildcard, so that pattern could never match.
  // "csp_officials" happened to work by accident, because "_" IS a Postgres
  // ILIKE single-character wildcard, but that's a coincidence, not a real
  // matching strategy. Fix: collapse any run of non-alphanumeric characters
  // in the handle into a "%" wildcard before matching, so punctuation
  // differences between the handle and the brand name (dot, underscore,
  // space, etc.) don't matter.
  const brandPattern = `%${normalized.replace(/[^a-zA-Z0-9]+/g, "%")}%`;

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", account.user_id)
    .ilike("name", brandPattern)
    .limit(1)
    .maybeSingle();

  return { account, brandId: brand?.id ?? null, error: null };
}
