"use client";

import { BadgeCheck, Link2Off } from "lucide-react";

interface Props {
  connected: boolean;
}

export function AccountStatus({ connected }: Props) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
        <BadgeCheck className="h-4 w-4" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
      <Link2Off className="h-4 w-4" />
      Not Connected
    </div>
  );
}