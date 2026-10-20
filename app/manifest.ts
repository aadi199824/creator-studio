import type { MetadataRoute } from "next";

/**
 * Web app manifest — lets Creator Studio be added to the phone's home
 * screen. Required for notifications on iPhone (iOS 16.4+), which only
 * allows web push for home-screen web apps.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Creator Studio AI",
    short_name: "Creator Studio",
    description: "AI-powered social media management platform",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#4F46E5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
