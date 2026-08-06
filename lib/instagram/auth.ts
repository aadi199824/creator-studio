const INSTAGRAM_APP_ID =
  process.env.INSTAGRAM_APP_ID!;

const INSTAGRAM_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI!;

export function getInstagramOAuthUrl() {
  const params = new URLSearchParams({
    force_reauth: "true",
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    response_type: "code",
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ].join(","),
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}