import { NextRequest, NextResponse } from "next/server";
import { getInstagramOAuthUrl } from "@/lib/instagram/auth";
import { getFacebookOAuthUrl } from "@/lib/instagram/facebook-auth";

/**
 * Two supported ways to connect an Instagram Business account.
 * ?provider=facebook_graph  -> Facebook Page login (existing Page + linked IG account)
 * ?provider=instagram_direct (default) -> direct Instagram Business Login
 */
export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");

  if (provider === "facebook_graph") {
    return NextResponse.redirect(getFacebookOAuthUrl());
  }

  return NextResponse.redirect(getInstagramOAuthUrl());
}
