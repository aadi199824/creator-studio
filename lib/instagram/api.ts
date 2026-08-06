const GRAPH_API = "https://graph.facebook.com/v23.0";

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
}

export interface PageDetails {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface InstagramProfile {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export async function getFacebookPages(accessToken: string) {
  const response = await fetch(
    `${GRAPH_API}/me/accounts?access_token=${accessToken}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Facebook Pages");
  }

  return (await response.json()) as FacebookPagesResponse;
}

export async function getPageDetails(
  pageId: string,
  pageAccessToken: string
) {
  const response = await fetch(
    `${GRAPH_API}/${pageId}?fields=id,name,instagram_business_account&access_token=${pageAccessToken}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch page details");
  }

  return (await response.json()) as PageDetails;
}

export async function getInstagramProfile(
  instagramId: string,
  pageAccessToken: string
) {
  const response = await fetch(
    `${GRAPH_API}/${instagramId}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Instagram profile");
  }

  return (await response.json()) as InstagramProfile;
}