"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  User,
} from "lucide-react";

import { ConnectButton } from "./connect-button";
import { SocialService } from "@/lib/services/social.service";

interface InstagramAccount {
  id: string;
  account_name: string;
  account_id: string;
  platform: string;
}

export function InstagramCard() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstagramAccounts();
  }, []);

  async function loadInstagramAccounts() {
    setLoading(true);

    const { data, error } = await SocialService.getAccounts();

    if (error) {
      console.error("Failed to load accounts:", error);
      setLoading(false);
      return;
    }

    const instagramAccounts =
      data?.filter(
        (account) => account.platform === "instagram"
      ) ?? [];

    setAccounts(instagramAccounts);
    setLoading(false);
  }

  async function handleDisconnect(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect this Instagram account?"
    );

    if (!confirmed) return;

    const { error } = await SocialService.disconnect(id);

    if (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect account.");
      return;
    }

    // Remove from UI without reloading page
    setAccounts((current) =>
      current.filter((account) => account.id !== id)
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-3 text-white">
            <ImageIcon className="h-6 w-6" />
          </div>

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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          @{account.account_name}
                        </h3>

                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Instagram Business
                      </p>
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
                      onClick={() =>
                        handleDisconnect(account.id)
                      }
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