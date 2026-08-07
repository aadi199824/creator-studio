import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;

interface TokenResponse {
  data?: Array<{
    access_token: string;
    user_id: string;
    permissions?: string;
  }>;

  // Keep compatibility in case Meta returns the simpler shape.
  access_token?: string;
  user_id?: string;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface InstagramProfile {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // User cancelled Instagram authorization
  if (oauthError) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?error=access_denied",
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?error=missing_code",
        request.url
      )
    );
  }

  try {
    if (
      !INSTAGRAM_APP_ID ||
      !INSTAGRAM_APP_SECRET ||
      !INSTAGRAM_REDIRECT_URI
    ) {
      throw new Error(
        "Instagram environment variables are missing."
      );
    }

    /*
     * STEP 1
     * Exchange authorization code for short-lived token.
     */

    const tokenBody = new FormData();

    tokenBody.append("client_id", INSTAGRAM_APP_ID);
    tokenBody.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenBody.append("grant_type", "authorization_code");
    tokenBody.append("redirect_uri", INSTAGRAM_REDIRECT_URI);

    // Meta may append #_ to the returned code.
    tokenBody.append("code", code.replace(/#_$/, ""));

    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: tokenBody,
        cache: "no-store",
      }
    );

    const tokenData: TokenResponse =
      await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(
        "Instagram token exchange failed:",
        tokenData
      );

      throw new Error(
        "Unable to exchange Instagram authorization code."
      );
    }

    const shortLivedAccessToken =
      tokenData.data?.[0]?.access_token ??
      tokenData.access_token;

    const instagramUserId =
      tokenData.data?.[0]?.user_id ??
      tokenData.user_id;

    if (!shortLivedAccessToken) {
      console.error(
        "Instagram token response:",
        tokenData
      );

      throw new Error(
        "Instagram access token was not returned."
      );
    }

    /*
     * STEP 2
     * Exchange short-lived token for long-lived token.
     */

    const longTokenUrl = new URL(
      "https://graph.instagram.com/access_token"
    );

    longTokenUrl.searchParams.set(
      "grant_type",
      "ig_exchange_token"
    );

    longTokenUrl.searchParams.set(
      "client_secret",
      INSTAGRAM_APP_SECRET
    );

    longTokenUrl.searchParams.set(
      "access_token",
      shortLivedAccessToken
    );

    const longTokenResponse = await fetch(
      longTokenUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const longTokenData: LongLivedTokenResponse =
      await longTokenResponse.json();

    if (!longTokenResponse.ok) {
      console.error(
        "Long-lived token exchange failed:",
        longTokenData
      );

      throw new Error(
        "Unable to generate long-lived Instagram token."
      );
    }

    const accessToken =
      longTokenData.access_token;

    if (!accessToken) {
      throw new Error(
        "Long-lived Instagram access token missing."
      );
    }

    /*
     * STEP 3
     * Get Instagram profile.
     */

    const profileUrl = new URL(
      "https://graph.instagram.com/me"
    );

    profileUrl.searchParams.set(
      "fields",
      "id,username,profile_picture_url"
    );

    profileUrl.searchParams.set(
      "access_token",
      accessToken
    );

    const profileResponse = await fetch(
      profileUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const profile: InstagramProfile =
      await profileResponse.json();

    if (!profileResponse.ok) {
      console.error(
        "Instagram profile request failed:",
        profile
      );

      throw new Error(
        "Unable to fetch Instagram profile."
      );
    }

    if (!profile.id || !profile.username) {
      console.error(
        "Invalid Instagram profile:",
        profile
      );

      throw new Error(
        "Instagram profile information is incomplete."
      );
    }

    /*
     * STEP 4
     * Get currently authenticated Creator Studio user.
     */

    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Supabase auth error:",
        userError
      );

      throw userError;
    }

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/login?error=instagram_auth_required",
          request.url
        )
      );
    }

    /*
     * STEP 5
     * Calculate token expiration.
     */

    let expiresAt: string | null = null;

    if (longTokenData.expires_in) {
      expiresAt = new Date(
        Date.now() +
          longTokenData.expires_in * 1000
      ).toISOString();
    }

    /*
     * STEP 6
     * Check whether this Instagram account
     * is already connected by this user.
     */

    const { data: existingAccount } =
      await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "instagram")
        .eq("account_id", profile.id)
        .maybeSingle();

    if (existingAccount) {
      /*
       * Refresh existing account/token.
       */

      const { error: updateError } =
        await supabase
          .from("social_accounts")
          .update({
            account_name: profile.username,
            access_token: accessToken,
            expires_at: expiresAt,
          })
          .eq("id", existingAccount.id);

      if (updateError) {
        console.error(
          "Instagram account update error:",
          updateError
        );

        throw updateError;
      }
    } else {
      /*
       * Save new Instagram account.
       */

      const { error: insertError } =
        await supabase
          .from("social_accounts")
          .insert({
            user_id: user.id,
            platform: "instagram",
            account_name: profile.username,
            account_id:
              profile.id || instagramUserId,
            access_token: accessToken,
            refresh_token: null,
            expires_at: expiresAt,
            page_id: null,
          });

      if (insertError) {
        console.error(
          "Instagram account insert error:",
          insertError
        );

        throw insertError;
      }
    }

    console.log(
      "Instagram account connected:",
      profile.username
    );

    /*
     * STEP 7
     * Return to Instagram dashboard.
     */

    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?oauth=success",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "INSTAGRAM DIRECT CALLBACK ERROR:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/dashboard/instagram?error=callback_failed",
        request.url
      )
    );
  }
}