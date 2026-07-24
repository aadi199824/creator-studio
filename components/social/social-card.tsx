interface SocialCardProps {
  platform: "instagram" | "facebook" | "linkedin" | "x";
  connected: boolean;
  accountName?: string;

  onConnect: () => void;
  onDisconnect: () => void;
}