"use client";

import { CheckCircle2, ExternalLink, User } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConnectedAccountProps {
  username: string;
  profilePicture?: string;
  accountType?: string;
}

export function ConnectedAccount({
  username,
  profilePicture,
  accountType,
}: ConnectedAccountProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {profilePicture ? (
          <img
            src={profilePicture}
            alt={username}
            className="h-16 w-16 rounded-full border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">@{username}</h3>

            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>

          <p className="text-sm text-muted-foreground">
            {accountType ?? "Instagram Business"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
        variant="outline"
        onClick={() =>
          window.open(
            `https://instagram.com/${username}`,
            "_blank"
          )
        }
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        View Profile
      </Button>

        <Button variant="destructive">
          Disconnect
        </Button>
      </div>
    </div>
  );
}