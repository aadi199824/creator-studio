import { NextRequest, NextResponse } from "next/server";

import { AUTOMATION_ACCOUNTS, type AutomationAccount } from "@/lib/automation/brand-profiles";
import { CSP_FORMATS, type CspFormat } from "@/lib/automation/csp-content";
import { type DraftResult, generateForAccount } from "@/lib/automation/daily-generator";

export const maxDuration = 300;

/**
 * GET /api/automation/generate-daily[?account=<handle>][&format=<csp format>]
 *
 * Vercel Cron entry point (see vercel.json). Generates one review-only draft
 * per account — never publishes. Pass ?account=csp_officials (or
 * tradeverse.academy) to re-run a single account, and ?format=<csp format>
 * to pick a CSP template instead of today's rotation. Generation logic lives
 * in lib/automation/daily-generator.ts.
 */

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  return (
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = request.nextUrl.searchParams.get("account");

  // Optional ?format=<csp format> to pick a CSP template instead of today's
  // rotation (only affects @csp_officials).
  const requestedFormat = request.nextUrl.searchParams.get("format");
  let cspFormat: CspFormat | undefined;
  if (requestedFormat) {
    if (!(CSP_FORMATS as readonly string[]).includes(requestedFormat)) {
      return NextResponse.json(
        { error: `Unknown format "${requestedFormat}". Use one of: ${CSP_FORMATS.join(", ")}.` },
        { status: 400 }
      );
    }
    cspFormat = requestedFormat as CspFormat;
  }
  let accounts: readonly AutomationAccount[] = AUTOMATION_ACCOUNTS;

  if (requested) {
    const match = AUTOMATION_ACCOUNTS.find(
      (handle) => handle === requested.replace(/^@/, "").trim().toLowerCase()
    );

    if (!match) {
      return NextResponse.json(
        { error: `Unknown account "${requested}". Use one of: ${AUTOMATION_ACCOUNTS.join(", ")}.` },
        { status: 400 }
      );
    }

    accounts = [match];
  }

  const results: DraftResult[] = [];
  const errors: { instagram_username: string; error: string }[] = [];

  for (const username of accounts) {
    try {
      results.push(await generateForAccount(username, { cspFormat }));
    } catch (error) {
      console.error(`Daily automation failed for ${username}:`, error);

      errors.push({
        instagram_username: username,
        error: error instanceof Error ? error.message : "Unknown automation error.",
      });
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    generated: results,
    errors,
    generated_at: new Date().toISOString(),
  });
}
