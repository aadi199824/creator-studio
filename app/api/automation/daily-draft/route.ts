import { NextRequest, NextResponse } from "next/server";

import {
  findAccountByInstagramUsername,
  verifyAutomationSecret,
} from "@/lib/services/automation.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { dailyDraftSchema } from "@/lib/validations/automation";

/**
 * POST /api/automation/daily-draft
 *
 * Called by the daily scheduled-task automation (never by the browser).
 * Takes a fully-written post (text already researched and drafted by the
 * caller, following each brand's content guardrails) plus an image prompt,
 * generates the image, and saves everything as a status: "draft" row in
 * ai_generations — never publishes. A human must review and publish it from
 * the Content Library, same as any other draft.
 */
export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dailyDraftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    instagram_username,
    content_type,
    tone,
    topic,
    prompt_summary,
    post_text,
    image_prompt,
    sources,
  } = parsed.data;

  const { account, brandId, error: lookupError } =
    await findAccountByInstagramUsername(instagram_username);

  if (lookupError || !account) {
    return NextResponse.json(
      {
        error: `No connected Instagram account matching "${instagram_username}" was found.`,
      },
      { status: 404 }
    );
  }

  // Automatic images via pollinations.ai were removed (2026-10-19) — they
  // didn't match either brand's layout. This endpoint now saves the draft
  // without an image; attach one manually before publishing. Tradeverse
  // template rendering lives in /api/automation/generate-daily.
  const imageUrl: string | null = null;
  const imageError: string | null = null;
  const imageNote =
    "\n\n[Automation note: no automatic image — attach one before publishing. Image prompt: " +
    image_prompt +
    "]";

  const generatedContent =
    post_text +
    (sources && sources.length > 0
      ? `\n\nSources:\n${sources.map((s) => `- ${s}`).join("\n")}`
      : "");

  const supabase = createAdminSupabaseClient();
  const { data: draft, error: insertError } = await supabase
    .from("ai_generations")
    .insert({
      user_id: account.user_id,
      brand_id: brandId,
      social_account_id: account.id,
      platform: "instagram",
      content_type,
      tone,
      topic,
      prompt: prompt_summary + imageNote,
      generated_content: generatedContent,
      image_url: imageUrl,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Daily draft insert failed:", insertError);
    return NextResponse.json(
      { error: "Draft was generated but could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    id: draft.id,
    image_url: imageUrl,
    brand_id: brandId,
    image_error: imageError,
  });
}
