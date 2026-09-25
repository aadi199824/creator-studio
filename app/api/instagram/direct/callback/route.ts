import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cacheProfilePicture } from "@/lib/instagram/profile-picture";

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TokenResponse {
  data?: Array<{
    access_token: string;
    user_id: string;
    permissions?: string;
  }>;

  access_token?: string;
  user_id?: string;

  error_type?: string;
  code?: number;
  error_message?: string;
}

interface LongLivedTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;

  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

interface InstagramProfile {
  id?: string;
  username?: string;
  profile_picture_url?: string;

  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function validateEnvironment() {
  if (!INSTAGRAM_APP_ID) {
    throw new Error("INSTAGRAM_APP_ID environment variable is missing.");
  }
  if (!INSTAGRAM_APP_SECRET) {
    throw new Error("INSTAGRAM_APP_SECRET environment variable is missing.");
  }
  if (!INSTAGRAM_REDIRECT_URI) {
    throw new Error(
      "INSTAGRAM_REDIRECT_URI environment variable is missing."
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Callback                                                                   */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    console.error(
      "Instagram authorization denied:",
      oauthError,
      oauthErrorDescription
    );

    return redirect(request, "/dashboard/instagram?error=access_denied");
  }

  if (!code) {
    return redirect(request, "/dashboard/instagram?error=missing_code");
  }

  try {
    validateEnvironment();

    /* STEP 1: Exchange authorization code for short-lived access token */
    const tokenBody = new FormData();
    tokenBody.append("client_id", INSTAGRAM_APP_ID!);
    tokenBody.append("client_secret", INSTAGRAM_APP_SECRET!);
    tokenBody.append("grant_type", "authorization_code");
    tokenBody.append("redirect_uri", INSTAGRAM_REDIRECT_URI!);
    tokenBody.append("code", code.replace(/#_$/, ""));

    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      { method: "POST", body: tokenBody, cache: "no-store" }
    );

    const tokenData: TokenResponse = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Instagram short-lived token exchange failed:",
        tokenData
      );
      throw new Error(
        tokenData.error_message ||
          "Unable to exchange Instagram authorization code."
      );
    }

    const shortLivedAccessToken =
      tokenData.data?.[0]?.access_token ?? tokenData.access_token;
    const instagramUserId = tokenData.data?.[0]?.user_id ?? tokenData.user_id;

    if (!shortLivedAccessToken) {
      console.error(
        "Instagram token response did not contain access_token:",
        tokenData
      );
      throw new Error("Instagram access token was not returned.");
    }

    /* STEP 2: Exchange short-lived token for long-lived token */
    const longTokenUrl = new URL(
      "https://graph.instagram.com/access_token"
    );
    longTokenUrl.searchParams.set("grant_type", "ig_exchange_token");
    longTokenUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET!);
    longTokenUrl.searchParams.set("access_token", shortLivedAccessToken);

    const longTokenResponse = await fetch(longTokenUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const longTokenData: LongLivedTokenResponse =
      await longTokenResponse.json();

    if (!longTokenResponse.ok || !longTokenData.access_token) {
      console.error(
        "Instagram long-lived token exchange failed:",
        longTokenData
      );
      throw new Error(
        longTokenData.error?.message ||
          "Unable to generate long-lived Instagram token."
      );
    }

    const accessToken = longTokenData.access_token;

    /* STEP 3: Fetch Instagram profile */
    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,username,profile_picture_url");
    profileUrl.searchParams.set("access_token", accessToken);

    const profileResponse = await fetch(profileUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const profile: InstagramProfile = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error("Instagram profile request failed:", profile);
      throw new Error(
        profile.error?.message || "Unable to fetch Instagram profile."
      );
    }

    if (!profile.id || !profile.username) {
      console.error("Incomplete Instagram profile:", profile);
      throw new Error("Instagram profile information is incomplete.");
    }

    /* STEP 4: Get logged-in Creator Studio user */
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase authentication error:", userError);
      throw userError;
    }

    if (!user) {
      return redirect(request, "/login?error=instagram_auth_required");
    }

    /* STEP 5: Calculate token expiration */
    let expiresAt: string | null = null;

    if (longTokenData.expires_in) {
      expiresAt = new Date(
        Date.now() + longTokenData.expires_in * 1000
      ).toISOString();
    }

    /* STEP 6: Cache the profile picture in our own storage — Meta's CDN
       URL expires within hours/days, so storing it directly would show a
       broken image once that happens. */
    const cachedProfilePicture = await cacheProfilePicture(
      supabase,
      profile.profile_picture_url,
      user.id
    );

    /* STEP 7: Check whether account already exists */
    const { data: existingAccount, error: existingAccountError } =
      await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "instagram")
        .eq("account_id", profile.id)
        .maybeSingle();

    if (existingAccountError) {
      console.error("Instagram account lookup error:", existingAccountError);
      throw existingAccountError;
    }

    /* STEP 8: Update existing account OR insert new account */
    if (existingAccount) {
      const { error: updateError } = await supabase
        .from("social_accounts")
        .update({
          account_name: profile.username,
          auth_provider: "instagram_direct",
          access_token: accessToken,
          expires_at: expiresAt,
          profile_picture: cachedProfilePicture,
        })
        .eq("id", existingAccount.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Instagram account update error:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("social_accounts")
        .insert({
          user_id: user.id,
          platform: "instagram",
          auth_provider: "instagram_direct",
          account_name: profile.username,
          account_id: profile.id || instagramUserId,
          access_token: accessToken,
          refresh_token: null,
          expires_at: expiresAt,
          page_id: null, // Direct Instagram Login has no Facebook page
          profile_picture: cachedProfilePicture,
        });

      if (insertError) {
        console.error("Instagram account insert error:", insertError);
        throw insertError;
      }
    }

    /* STEP 9: Success */
    return redirect(request, "/dashboard/instagram?oauth=success");
  } catch (error: unknown) {
    console.error("INSTAGRAM DIRECT CALLBACK ERROR:", error);
    return redirect(request, "/dashboard/instagram?error=callback_failed");
  }
}
