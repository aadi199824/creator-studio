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
  User,
} from "lucide-react";

import { ConnectButton } from "./connect-button";
import { SocialService } from "@/lib/services/social.service";

interface InstagramAccount {
  id: string;
  account_name: string;
  account_id: string;
  platform: string;
  profile_picture?: string | null;
}

export function InstagramCard() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load Instagram accounts from Supabase
   */
  async function loadInstagramAccounts() {
    setLoading(true);

    try {
      const { data, error } = await SocialService.getAccounts();

      console.log("SOCIAL ACCOUNTS DATA:", data);
      console.log("SOCIAL ACCOUNTS ERROR:", error);

      if (error) {
        console.error("Failed to load accounts:", error);
        setAccounts([]);
        return;
      }

      const instagramAccounts =
        data?.filter(
          (account) => account.platform === "instagram"
        ) ?? [];

      console.log(
        "INSTAGRAM ACCOUNTS:",
        instagramAccounts
      );

      setAccounts(instagramAccounts);
    } catch (error) {
      console.error(
        "Unexpected error loading Instagram accounts:",
        error
      );

      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load accounts when component mounts
   */
  useEffect(() => {
    loadInstagramAccounts();
  }, []);

  /**
   * Disconnect Instagram account
   */
  async function handleDisconnect(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect this Instagram account?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await SocialService.disconnect(id);

    if (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect account.");
      return;
    }

    // Remove disconnected account from UI
    setAccounts((current) =>
      current.filter((account) => account.id !== id)
    );
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
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                        {account.profile_picture ? (
                          <img
                            src={account.profile_picture}
                            alt={`@${account.account_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
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

                      <p className="text-xs text-muted-foreground">
                        ID: {account.account_id}
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