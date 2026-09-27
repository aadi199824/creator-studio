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

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  // ROOT CAUSE HISTORY: a first attempt ILIKE'd the brand name against a
  // wildcard built from the handle (e.g. "csp%officials"), assuming the
  // brand name would be a longer, fuller version of the handle. Real brand
  // names are often SHORTER than the handle (e.g. brand "CSP" for handle
  // "csp_officials"), so that pattern still failed to match. Fixed by
  // fetching this user's brands and checking containment in both
  // directions on normalized (lowercased, alphanumeric-only) strings —
  // matches whether the brand name is a prefix/substring of the handle, or
  // vice versa.
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", account.user_id);

  const normalizedUsername = normalizeForMatch(normalized);

  const matchedBrand = (brands ?? []).find((brand) => {
    const normalizedBrandName = normalizeForMatch(brand.name);

    return (
      normalizedBrandName.length > 0 &&
      (normalizedUsername.includes(normalizedBrandName) ||
        normalizedBrandName.includes(normalizedUsername))
    );
  });

  return { account, brandId: matchedBrand?.id ?? null, error: null };
}
