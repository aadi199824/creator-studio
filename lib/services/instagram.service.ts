export type InstagramProvider = "facebook_graph" | "instagram_direct";

/**
 * Both supported ways a user can connect an Instagram Business account.
 * Every user picks whichever works for them — nothing here is fixed
 * per-deployment, so this is a genuine either/or per connection.
 */
export const INSTAGRAM_PROVIDERS: {
  id: InstagramProvider;
  label: string;
  description: string;
}[] = [
  {
    id: "facebook_graph",
    label: "Connect via Facebook Page",
    description:
      "Use a Facebook Page that already has an Instagram Business account linked to it.",
  },
  {
    id: "instagram_direct",
    label: "Connect via Instagram Business Login",
    description:
      "Log in directly with Instagram — no Facebook Page required.",
  },
];

export function getInstagramConnectUrl(provider: InstagramProvider) {
  return `/api/instagram/connect?provider=${provider}`;
}

export interface InstagramAccountDTO {
  id: string;
  username: string;
  account_id: string;
  platform: string;
  profile_picture: string | null;
  auth_provider?: InstagramProvider;
  expires_at?: string | null;
  is_active?: boolean;
}

export class InstagramService {
  static async listAccounts(): Promise<InstagramAccountDTO[]> {
    const response = await fetch("/api/instagram/accounts", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load Instagram accounts.");
    }

    const data = await response.json();
    return data.accounts ?? [];
  }
}
