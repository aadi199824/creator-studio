export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x";

export interface SocialAccount {
  id: string;
  user_id: string;

  platform: SocialPlatform;

  account_name: string | null;

  account_id: string | null;

  created_at: string;
}