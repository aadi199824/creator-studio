import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  getFacebookPages,
  getInstagramProfile,
  getPageDetails,
} from "@/lib/instagram/api";

const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = process.env.META_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/publishing?error=missing_code",
        request.url
      )
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://graph.facebook.com/v23.0/oauth/access_token?" +
        new URLSearchParams({
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        })
    );

    if (!tokenResponse.ok) {
      throw new Error("Unable to exchange code.");
    }

    const tokenData = await tokenResponse.json();

    // Fetch Facebook Pages
    const pages = await getFacebookPages(
      tokenData.access_token
    );

    if (!pages.data.length) {
      throw new Error("No Facebook Pages found.");
    }

    // Use first Page
    const page = pages.data[0];

    // Fetch Page details
    const pageDetails = await getPageDetails(
      page.id,
      page.access_token
    );

    if (!pageDetails.instagram_business_account) {
      throw new Error(
        "No Instagram Business Account linked."
      );
    }

    // Fetch Instagram profile
    const instagram = await getInstagramProfile(
      pageDetails.instagram_business_account.id,
      page.access_token
    );

    // Create Supabase server client
    const supabase = await createServerSupabaseClient();

    // Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("User not authenticated.");
    }

  // Save account
    const { error } = await supabase
    .from("social_accounts")
    .insert({
        user_id: user.id,
        platform: "instagram",
        account_name: instagram.username,
        account_id: instagram.id,
        page_id: page.id,
        access_token: page.access_token,
        expires_at: null,
    });

    if (error) {
    console.error(error);
    throw error;
    }

   
    console.log("================================");
    console.log("User:", user.id);
    console.log("Instagram:", instagram);
    console.log("Page:", page);
    console.log("Saved successfully");
    console.log("================================");

    return NextResponse.redirect(
      new URL(
        "/dashboard/publishing?success=instagram_connected",
        request.url
      )
    );
  } catch (error: any) {
    console.error("CALLBACK ERROR");
    console.error(error);

    return NextResponse.json(
      {
        error: error?.message ?? error,
      },
      {
        status: 500,
      }
    );
  }
}