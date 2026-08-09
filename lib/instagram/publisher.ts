const GRAPH_API = "https://graph.instagram.com/v23.0";

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

  console.log("===== INSTAGRAM MEDIA RESPONSE =====");
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        data.error_message ||
        "Unable to create media container."
    );
  }

  if (!data.id) {
    throw new Error(
      `Instagram media container created but no ID returned: ${JSON.stringify(
        data
      )}`
    );
  }

  return data.id;
}

export async function publishMedia(
  instagramAccountId: string,
  accessToken: string,
  creationId: string
) {
  console.log("===== INSTAGRAM PUBLISH REQUEST =====");
  console.log("Instagram Account ID:", instagramAccountId);
  console.log("Creation ID:", creationId);

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

  console.log("===== INSTAGRAM PUBLISH RESPONSE =====");
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        data.error_message ||
        "Unable to publish media."
    );
  }

  if (!data.id) {
    throw new Error(
      `Instagram publish succeeded but no Media ID returned: ${JSON.stringify(
        data
      )}`
    );
  }

  return data.id;
}

export async function publishInstagramImage(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
) {
  console.log("===== INSTAGRAM PUBLISH START =====");
  console.log("Instagram Account ID:", instagramAccountId);
  console.log("Image URL:", imageUrl);

  const creationId = await createMediaContainer(
    instagramAccountId,
    accessToken,
    imageUrl,
    caption
  );

  console.log("Creation ID:", creationId);

  const mediaId = await publishMedia(
    instagramAccountId,
    accessToken,
    creationId
  );

  console.log("Final Media ID:", mediaId);

  return mediaId;
}