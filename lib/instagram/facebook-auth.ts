const META_APP_ID = process.env.META_APP_ID!;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI!;

/**
 * Facebook Login for Business — used to connect an Instagram account that
 * is linked to a Facebook Page. This is the alternate path to
 * lib/instagram/auth.ts's direct Instagram Business Login: both are kept
 * so a user can connect with whichever their account actually supports.
 */
export function getFacebookOAuthUrl() {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    response_type: "code",
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
      "business_management",
    ].join(","),
  });

  return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string) {
  const META_APP_SECRET = process.env.META_APP_SECRET!;

  const url = new URL("https://graph.facebook.com/v23.0/oauth/access_token");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("redirect_uri", META_REDIRECT_URI);
  url.searchParams.set("code", code);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error?.message || "Unable to exchange Facebook authorization code."
    );
  }

  return data.access_token as string;
}
