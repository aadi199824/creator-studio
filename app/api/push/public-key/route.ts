import { NextResponse } from "next/server";

import { getVapidPublicKey } from "@/lib/services/push.service";

/**
 * GET /api/push/public-key
 *
 * Returns the VAPID *public* key the phone needs to subscribe. It's public
 * by design (every subscribing browser receives it); the private key never
 * leaves the server. Served at runtime so it only needs to be set as
 * VAPID_PUBLIC_KEY in Vercel — no NEXT_PUBLIC_ build-time variable.
 */
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Phone notifications aren't set up on the server yet (VAPID_PUBLIC_KEY is missing in Vercel)." },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey });
}
