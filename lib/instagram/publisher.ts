import type { InstagramProvider } from "@/lib/services/instagram.service";

/**
 * The two connection paths use different Graph API hosts:
 *  - instagram_direct (Instagram Business Login) -> graph.instagram.com
 *  - facebook_graph (Facebook Page + linked IG account) -> graph.facebook.com
 * Everything else about the publish flow (create container -> poll -> publish)
 * is identical, so we just swap the base URL.
 */
function graphApiBase(authProvider: InstagramProvider) {
  return authProvider === "facebook_graph"
    ? "https://graph.facebook.com/v23.0"
    : "https://graph.instagram.com/v23.0";
}

export async function createMediaContainer(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  authProvider: InstagramProvider
) {
  const response = await fetch(
    `${graphApiBase(authProvider)}/${instagramAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        data.error_message ||
        "Unable to create media container."
    );
  }

  if (!data.id) {
    throw new Error("Instagram media container created but no ID returned.");
  }

  return data.id as string;
}

/**
 * Wait until Instagram finishes processing the media container.
 */
async function waitForMediaContainer(
  creationId: string,
  accessToken: string,
  authProvider: InstagramProvider,
  maxAttempts = 10,
  delayMs = 3000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `${graphApiBase(
        authProvider
      )}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(
        accessToken
      )}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          data.error_message ||
          "Unable to check Instagram media status."
      );
    }

    const statusCode = data.status_code;

    if (statusCode === "FINISHED") {
      return;
    }

    if (statusCode === "ERROR") {
      throw new Error(data.status || "Instagram media processing failed.");
    }

    if (statusCode === "EXPIRED") {
      throw new Error(
        "Instagram media container expired before it could be published."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    "Instagram media is still processing after the maximum wait time."
  );
}

export async function publishMedia(
  instagramAccountId: string,
  accessToken: string,
  creationId: string,
  authProvider: InstagramProvider
) {
  const response = await fetch(
    `${graphApiBase(authProvider)}/${instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        data.error_message ||
        "Unable to publish media."
    );
  }

  if (!data.id) {
    throw new Error("Instagram publish succeeded but no Media ID returned.");
  }

  return data.id as string;
}

export async function publishInstagramImage(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  authProvider: InstagramProvider = "instagram_direct"
) {
  const creationId = await createMediaContainer(
    instagramAccountId,
    accessToken,
    imageUrl,
    caption,
    authProvider
  );

  await waitForMediaContainer(creationId, accessToken, authProvider);

  return await publishMedia(
    instagramAccountId,
    accessToken,
    creationId,
    authProvider
  );
}
