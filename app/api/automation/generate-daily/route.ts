import { NextRequest, NextResponse } from "next/server";

import {
  AUTOMATION_ACCOUNTS,
  AutomationAccount,
  buildAccountPrompt,
} from "@/lib/automation/brand-profiles";
import { buildCaptionWithHashtags } from "@/lib/instagram/caption";
import { AIService } from "@/lib/services/ai.service";
import {
  findAccountByInstagramUsername,
} from "@/lib/services/automation.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

type GeneratedSlide = {
  slide: number;
  on_image_text: string;
  visual: string;
  image_prompt: string;
};

type GeneratedPost = {
  topic: string;
  content_type: string;
  tone: string;
  layout: string;
  caption: string;
  hashtags: string[];
  slides: GeneratedSlide[];
  image_prompt: string;
  sources: string[];
};

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  return (
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

async function getRecentTopics(userId: string): Promise<string[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("ai_generations")
    .select("topic, created_at")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.topic)
    .filter((topic): topic is string => Boolean(topic));
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function extractJson(text: string): GeneratedPost {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.topic !== "string" ||
    typeof parsed.content_type !== "string" ||
    typeof parsed.tone !== "string" ||
    typeof parsed.caption !== "string" ||
    typeof parsed.image_prompt !== "string" ||
    !Array.isArray(parsed.slides) ||
    parsed.slides.length === 0
  ) {
    throw new Error(
      "Gemini returned an invalid daily-post structure (expected topic, content_type, tone, caption, slides[], image_prompt)."
    );
  }

  const slides: GeneratedSlide[] = parsed.slides
    .filter(
      (slide: unknown): slide is Record<string, unknown> =>
        Boolean(slide) && typeof slide === "object"
    )
    .map((slide: Record<string, unknown>, index: number) => ({
      slide: typeof slide.slide === "number" ? slide.slide : index + 1,
      on_image_text:
        typeof slide.on_image_text === "string" ? slide.on_image_text : "",
      visual: typeof slide.visual === "string" ? slide.visual : "",
      image_prompt:
        typeof slide.image_prompt === "string" ? slide.image_prompt : "",
    }));

  return {
    topic: parsed.topic,
    content_type: parsed.content_type,
    tone: parsed.tone,
    layout: typeof parsed.layout === "string" ? parsed.layout : "",
    caption: parsed.caption.trim(),
    hashtags: asStringArray(parsed.hashtags),
    slides,
    image_prompt: parsed.image_prompt,
    sources: asStringArray(parsed.sources),
  };
}

/**
 * Human-readable production plan stored in ai_generations.prompt (shown in
 * the Content Library's Edit dialog). Interim home for slide copy until a
 * dedicated slides column + carousel publishing exist — it must NOT go into
 * generated_content, because generated_content is what gets published as
 * the Instagram caption.
 */
function buildProductionPlan(post: GeneratedPost, imageNote: string): string {
  const slidesText = post.slides
    .map(
      (slide) =>
        `--- Slide ${slide.slide} ---\n` +
        `ON-IMAGE TEXT:\n${slide.on_image_text}\n\n` +
        `VISUAL:\n${slide.visual}\n\n` +
        `IMAGE PROMPT (paste into ChatGPT / GPT-image):\n${slide.image_prompt}`
    )
    .join("\n\n");

  return [
    `PRODUCTION PLAN — ${post.topic}`,
    `Format: ${post.content_type}${post.layout ? ` | Layout: ${post.layout}` : ""} | Slides: ${post.slides.length}`,
    imageNote,
    slidesText,
    post.sources.length > 0
      ? `Sources:\n${post.sources.map((source) => `- ${source}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateForAccount(username: AutomationAccount) {
  const { account, brandId, error } =
    await findAccountByInstagramUsername(username);

  if (error || !account) {
    throw new Error(
      `No connected Instagram account matching "${username}" was found.`
    );
  }

  const recentTopics = await getRecentTopics(account.user_id);

  const prompt = buildAccountPrompt(username, recentTopics);

  const generated = await AIService.generateContent(prompt);

  const post = extractJson(generated);

  let imageUrl: string | null = null;
  let imageNote = "";
  // Non-secret debug field surfaced in the response (never silently
  // swallowed) so a failed image generation is visible without needing to
  // dig through Vercel logs.
  let imageError: string | null = null;

  try {
    const { bytes, mimeType } = await AIService.generateImage(
      post.image_prompt
    );

    const supabase = createAdminSupabaseClient();

    const ext = mimeType.includes("png") ? "png" : "jpg";

    const path =
      `${account.user_id}/automation/${Date.now()}-${username}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    imageUrl = publicUrlData.publicUrl;
  } catch (error) {
    imageError = error instanceof Error ? error.message : String(error);

    console.error(
      `Image generation failed for ${username}:`,
      imageError
    );

    imageNote =
      "[Automation note: automatic image generation failed. Create the slides from the image prompts below and attach them before publishing.]";
  }

  // generated_content is published verbatim as the Instagram caption, so it
  // holds ONLY the caption + hashtags. Slide copy, image prompts, sources and
  // automation notes go into the production plan instead.
  const generatedContent = buildCaptionWithHashtags(post.caption, post.hashtags);
  const productionPlan = buildProductionPlan(post, imageNote);

  const supabase = createAdminSupabaseClient();

  const { data: draft, error: insertError } = await supabase
    .from("ai_generations")
    .insert({
      user_id: account.user_id,
      brand_id: brandId,
      social_account_id: account.id,
      platform: "instagram",
      content_type: post.content_type,
      tone: post.tone,
      topic: post.topic,
      prompt: productionPlan,
      generated_content: generatedContent,
      image_url: imageUrl,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    instagram_username: username,
    id: draft.id,
    topic: post.topic,
    image_url: imageUrl,
    brand_id: brandId,
    image_error: imageError,
  };
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const results = [];
  const errors = [];

  for (const username of AUTOMATION_ACCOUNTS) {
    try {
      const result = await generateForAccount(username);
      results.push(result);
    } catch (error) {
      console.error(
        `Daily automation failed for ${username}:`,
        error
      );

      errors.push({
        instagram_username: username,
        error:
          error instanceof Error
            ? error.message
            : "Unknown automation error.",
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
