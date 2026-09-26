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
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", account.user_id)
    .ilike("name", `%${normalized}%`)
    .limit(1)
    .maybeSingle();

  return { account, brandId: brand?.id ?? null, error: null };
}
