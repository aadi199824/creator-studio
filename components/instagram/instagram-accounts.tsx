"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/publishing/connect-button";
import { InstagramAvatar } from "@/components/instagram/instagram-avatar";
import { SocialService } from "@/lib/services/social.service";

interface Account {
  id: string;
  username: string;
  profile_picture?: string | null;
  is_active: boolean;
  auth_provider?: "facebook_graph" | "instagram_direct";
}

export default function InstagramAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);

    try {
      const res = await fetch("/api/instagram/accounts", { cache: "no-store" });
      const data = await res.json();
      setAccounts(data.accounts ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(id: string) {
    const { error } = await SocialService.disconnect(id);

    if (error) {
      toast.error("Failed to disconnect account.");
      return;
    }

    toast.success("Instagram account disconnected.");
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Connected Accounts</h2>
        <ConnectButton />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          No Instagram account connected.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <InstagramAvatar
                  src={account.profile_picture}
                  username={account.username}
                  className="h-12 w-12"
                  fallbackClassName="text-lg"
                />

                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    @{account.username}
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {account.auth_provider === "facebook_graph"
                        ? "Facebook Page"
                        : "Direct Login"}
                    </Badge>
                  </div>

                  <div
                    className={`text-sm ${
                      account.is_active === false
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {account.is_active === false ? "Expired" : "Connected"}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleDisconnect(account.id)}
                className="hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
