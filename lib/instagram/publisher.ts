const GRAPH_API =
  "https://graph.instagram.com/v23.0";

interface InstagramApiResponse {
  id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

async function instagramRequest(
  url: string,
  accessToken: string,
  body: Record<string, string>
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });

  const data: InstagramApiResponse =
    await response.json();

  if (!response.ok) {
    console.error(
      "Instagram API error:",
      data
    );

    throw new Error(
      data.error?.message ||
        "Instagram API request failed."
    );
  }

  return data;
}

export async function createMediaContainer(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
) {
  const url =
    `${GRAPH_API}/${instagramAccountId}/media`;

  const data = await instagramRequest(
    url,
    accessToken,
    {
      image_url: imageUrl,
      caption: caption || "",
    }
  );

  if (!data.id) {
    throw new Error(
      "Instagram did not return a media container ID."
    );
  }

  console.log(
    "Instagram media container created:",
    data.id
  );

  return data.id;
}

export async function publishMedia(
  instagramAccountId: string,
  accessToken: string,
  creationId: string
) {
  const url =
    `${GRAPH_API}/${instagramAccountId}/media_publish`;

  const data = await instagramRequest(
    url,
    accessToken,
    {
      creation_id: creationId,
    }
  );

  if (!data.id) {
    throw new Error(
      "Instagram did not return a published media ID."
    );
  }

  console.log(
    "Instagram media published:",
    data.id
  );

  return data.id;
}

export async function publishInstagramImage(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
) {
  if (!instagramAccountId) {
    throw new Error(
      "Instagram account ID is required."
    );
  }

  if (!accessToken) {
    throw new Error(
      "Instagram access token is required."
    );
  }

  if (!imageUrl) {
    throw new Error(
      "Image URL is required."
    );
  }

  console.log(
    "Publishing Instagram image..."
  );

  console.log(
    "Instagram Account ID:",
    instagramAccountId
  );

  const creationId =
    await createMediaContainer(
      instagramAccountId,
      accessToken,
      imageUrl,
      caption
    );

  const mediaId =
    await publishMedia(
      instagramAccountId,
      accessToken,
      creationId
    );

  return mediaId;
}