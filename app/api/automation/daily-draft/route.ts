import { NextRequest, NextResponse } from "next/server";

import { AIService } from "@/lib/services/ai.service";
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

  let imageUrl: string | null = null;
  let imageNote = "";

  try {
    const { bytes, mimeType } = await AIService.generateImage(image_prompt);
    const supabase = createAdminSupabaseClient();
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const path = `${account.user_id}/automation/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, bytes, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    imageUrl = publicUrlData.publicUrl;
  } catch (error) {
    console.error("Daily draft image generation failed:", error);
    imageNote =
      "\n\n[Automation note: image generation failed for this draft — please attach an image manually before publishing.]";
  }

  const generatedContent =
    post_text +
    imageNote +
    (sources && sources.length > 0
      ? `\n\nSources:\n${sources.map((s) => `- ${s}`).join("\n")}`
      : "");

  const supabase = createAdminSupabaseClient();
  const { data: draft, error: insertError } = await supabase
    .from("ai_generations")
    .insert({
      user_id: account.user_id,
      brand_id: brandId,
      platform: "instagram",
      content_type,
      tone,
      topic,
      prompt: prompt_summary,
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
  });
}
