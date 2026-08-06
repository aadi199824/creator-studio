"use client";

import { InstagramCard } from "@/components/publishing/instagram-card";
import { PublishDialog } from "@/components/publishing/publish-dialog";
import { PublishingHistory } from "@/components/publishing/publishing-history";

export default function PublishingPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Publishing</h1>

        <p className="mt-2 text-muted-foreground">
          Connect your Instagram Business account to publish content.
        </p>
      </div>

      {/* Connected Instagram Account */}
      <InstagramCard />

      {/* Publish Form */}
      <PublishDialog />

      {/* Publishing History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Publishing History
        </h2>

        <PublishingHistory />
      </div>
    </div>
  );
}