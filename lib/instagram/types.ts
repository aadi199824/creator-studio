export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
}

export interface InstagramProfile {
  id: string;
  username: string;
  profile_picture_url?: string;
}