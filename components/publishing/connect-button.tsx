"use client";

import { Loader2, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);

    window.location.href = "/api/instagram/connect";
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      size="lg"
      className="w-full sm:w-auto"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Link2 className="mr-2 h-4 w-4" />
          Connect Instagram
        </>
      )}
    </Button>
  );
}