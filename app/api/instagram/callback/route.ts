import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exchangeFacebookCode } from "@/lib/instagram/facebook-auth";
import {
  getFacebookPages,
  getPageDetails,
  getInstagramProfile,
} from "@/lib/instagram/api";
import { cacheProfilePicture } from "@/lib/instagram/profile-picture";

/**
 * Facebook Login for Business callback — the other of the two supported
 * Instagram connection paths (see app/api/instagram/direct/callback for
 * the direct Instagram Business Login path). This one:
 *  1. Exchanges the auth code for a user access token
 *  2. Lists the user's Facebook Pages
 *  3. For each Page with a linked Instagram Business account, saves it
 */
function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirect(request, "/dashboard/instagram?error=access_denied");
  }

  if (!code) {
    return redirect(request, "/dashboard/instagram?error=missing_code");
  }

  try {
    const userAccessToken = await exchangeFacebookCode(code);

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect(request, "/login?error=instagram_auth_required");
    }

    const pages = await getFacebookPages(userAccessToken);

    let connectedCount = 0;

    for (const page of pages.data) {
      const details = await getPageDetails(page.id, page.access_token);

      if (!details.instagram_business_account?.id) {
        // This Page has no linked Instagram Business account — skip it.
        continue;
      }

      const instagramAccountId = details.instagram_business_account.id;

      const profile = await getInstagramProfile(
        instagramAccountId,
        page.access_token
      );

      // Meta's CDN URL for profile_picture_url expires within hours/days —
      // cache our own permanent copy so the sidebar/publishing UI never
      // shows a broken image later.
      const cachedProfilePicture = await cacheProfilePicture(
        supabase,
        profile.profile_picture_url,
        user.id
      );

      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "instagram")
        .eq("account_id", instagramAccountId)
        .maybeSingle();

      const row = {
        user_id: user.id,
        platform: "instagram",
        auth_provider: "facebook_graph",
        account_name: profile.username,
        account_id: instagramAccountId,
        page_id: page.id,
        access_token: page.access_token,
        profile_picture: cachedProfilePicture,
        expires_at: null, // Page access tokens obtained this way do not expire
      };

      if (existing) {
        await supabase
          .from("social_accounts")
          .update(row)
          .eq("id", existing.id)
          .eq("user_id", user.id);
      } else {
        await supabase.from("social_accounts").insert(row);
      }

      connectedCount += 1;
    }

    if (connectedCount === 0) {
      return redirect(
        request,
        "/dashboard/instagram?error=no_linked_instagram_account"
      );
    }

    return redirect(request, "/dashboard/instagram?oauth=success");
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return redirect(request, "/dashboard/instagram?error=callback_failed");
  }
}
