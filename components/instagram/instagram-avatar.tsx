"use client";

import { useState } from "react";

interface Props {
  src?: string | null;
  username?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders a connected account's profile picture, falling back to an
 * initials badge if the image is missing or fails to load (e.g. an old
 * cached URL that's since been replaced or removed).
 */
export function InstagramAvatar({
  src,
  username,
  className = "h-11 w-11",
  fallbackClassName = "text-sm",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700 font-bold text-white ${className} ${fallbackClassName}`}
      >
        {username?.charAt(0).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={username ? `@${username}` : "Profile picture"}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
