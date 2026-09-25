"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  INSTAGRAM_PROVIDERS,
  getInstagramConnectUrl,
} from "@/lib/services/instagram.service";

export function ConnectButton() {
  const [loading, setLoading] = useState(false);

  function handleConnect(providerId: string) {
    setLoading(true);
    window.location.href = getInstagramConnectUrl(providerId as any);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} size="lg" className="w-full sm:w-auto">
          <Link2 className="mr-2 h-4 w-4" />
          {loading ? "Connecting..." : "Connect Instagram"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        {INSTAGRAM_PROVIDERS.map((provider) => (
          <DropdownMenuItem
            key={provider.id}
            onClick={() => handleConnect(provider.id)}
            className="flex-col items-start gap-0.5 py-2"
          >
            <span className="font-medium">{provider.label}</span>
            <span className="text-xs text-muted-foreground">
              {provider.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
