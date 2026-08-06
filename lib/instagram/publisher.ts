const GRAPH_API = "https://graph.facebook.com/v23.0";

export async function createMediaContainer(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
) {
  const response = await fetch(
    `${GRAPH_API}/${instagramAccountId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to create media container.");
  }

  return data.id;
}

export async function publishMedia(
  instagramAccountId: string,
  accessToken: string,
  creationId: string
) {
  const response = await fetch(
    `${GRAPH_API}/${instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to publish media.");
  }

  return data.id;
}

export async function publishInstagramImage(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
) {
  const creationId = await createMediaContainer(
    instagramAccountId,
    accessToken,
    imageUrl,
    caption
  );

  const mediaId = await publishMedia(
    instagramAccountId,
    accessToken,
    creationId
  );

  return mediaId;
}