"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";

import { ConnectButton } from "./connect-button";
import { InstagramAvatar } from "@/components/instagram/instagram-avatar";
import { SocialService } from "@/lib/services/social.service";

interface InstagramAccount {
  id: string;
  account_name: string;
  account_id: string;
  platform: string;
  profile_picture?: string | null;
  auth_provider?: "facebook_graph" | "instagram_direct";
}

export function InstagramCard() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInstagramAccounts() {
    setLoading(true);

    try {
      const { data, error } = await SocialService.getAccounts();

      if (error) {
        console.error("Failed to load Instagram accounts:", error);
        setAccounts([]);
        return;
      }

      setAccounts(
        (data ?? []).filter((account) => account.platform === "instagram")
      );
    } catch (error) {
      console.error("Unexpected error loading Instagram accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstagramAccounts();
  }, []);

  async function handleDisconnect(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect this Instagram account?"
    );

    if (!confirmed) return;

    const { error } = await SocialService.disconnect(id);

    if (error) {
      toast.error("Failed to disconnect account.");
      return;
    }

    toast.success("Instagram account disconnected.");
    setAccounts((current) => current.filter((account) => account.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Instagram Accounts</CardTitle>
            <CardDescription>
              Connect and manage your Instagram Business accounts.
            </CardDescription>
          </div>

          {accounts.length > 0 && (
            <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              {accounts.length} Connected
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading Instagram accounts...
          </p>
        ) : accounts.length === 0 ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              No Instagram Business account connected.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <InstagramAvatar
                      src={account.profile_picture}
                      username={account.account_name}
                      className="h-12 w-12"
                      fallbackClassName="text-lg"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          @{account.account_name}
                        </h3>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Instagram Business
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {account.auth_provider === "facebook_graph"
                            ? "Facebook Page"
                            : "Direct Login"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://www.instagram.com/${account.account_name}/`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-5">
              <ConnectButton />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
