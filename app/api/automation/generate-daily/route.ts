import { NextRequest, NextResponse } from "next/server";

import {
  AUTOMATION_ACCOUNTS,
  AutomationAccount,
  TRADEVERSE_JOURNEY_LENGTH,
  buildAccountPrompt,
  getNextTradeverseDay,
} from "@/lib/automation/brand-profiles";
import { getCspFormatForDate, parseCspTemplate } from "@/lib/automation/csp-content";
import { generateSlideArt } from "@/lib/automation/tradeverse-art";
import {
  TradeversePost,
  describeTradeverseSlide,
  parseTradeversePost,
} from "@/lib/automation/tradeverse-content";
import { buildCaptionWithHashtags } from "@/lib/instagram/caption";
import { renderCspPost } from "@/lib/render/csp-post";
import { renderTradeverseSlide } from "@/lib/render/tradeverse-slides";
import { AIService } from "@/lib/services/ai.service";
import { findAccountByInstagramUsername } from "@/lib/services/automation.service";
import { ImageGenerationService } from "@/lib/services/image-generation.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

/**
 * GET /api/automation/generate-daily[?account=<handle>]
 *
 * Vercel Cron entry point (see vercel.json). Generates one review-only draft
 * per account — never publishes. Pass ?account=csp_officials (or
 * tradeverse.academy) to re-run a single account without creating a
 * duplicate draft for the other one.
 *
 * Images:
 * - @tradeverse.academy: every carousel slide is rendered from the fixed
 *   brand template (lib/render/tradeverse-slides.tsx). Artwork comes from
 *   Cloudflare FLUX (text-free) when CLOUDFLARE_* env vars are set, else
 *   code-drawn illustrations. Slide 1 becomes the draft's image.
 * - @csp_officials: single image drawn entirely in code (lib/render/csp/*)
 *   with proper Devanagari shaping — no AI image. The format rotates daily:
 *   dictionary → chat → notifications → poster → versus. If Gemini omits the
 *   template fields, the draft is saved without an image and carries
 *   GPT-image prompts instead.
 */

type CspSlide = {
  slide: number;
  on_image_text: string;
  visual: string;
  image_prompt: string;
};

type CspPost = {
  topic: string;
  content_type: string;
  tone: string;
  layout: string;
  caption: string;
  hashtags: string[];
  slides: CspSlide[];
};

type DraftResult = {
  instagram_username: AutomationAccount;
  id: string;
  topic: string;
  image_url: string | null;
  slide_image_urls: string[];
  brand_id: string | null;
  image_error: string | null;
};

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  return (
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

/**
 * Recent topics for ONE Instagram account. Filtering by social_account_id
 * (not just user_id) matters because both brands can belong to the same
 * user — otherwise CSP topics leak into Tradeverse's anti-repeat list.
 */
async function getRecentTopics(socialAccountId: string): Promise<string[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("ai_generations")
    .select("topic, created_at")
    .eq("social_account_id", socialAccountId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: { topic: string | null }) => row.topic)
    .filter((topic: string | null): topic is string => Boolean(topic));
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: unknown = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini did not return a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseCspPost(parsed: Record<string, unknown>): CspPost {
  if (
    typeof parsed.topic !== "string" ||
    typeof parsed.caption !== "string" ||
    !Array.isArray(parsed.slides) ||
    parsed.slides.length === 0
  ) {
    throw new Error(
      "Gemini returned an invalid CSP post (expected topic, caption and slides[])."
    );
  }

  const slides: CspSlide[] = parsed.slides
    .filter(
      (slide: unknown): slide is Record<string, unknown> =>
        Boolean(slide) && typeof slide === "object"
    )
    .map((slide: Record<string, unknown>, index: number) => ({
      slide: typeof slide.slide === "number" ? slide.slide : index + 1,
      on_image_text: typeof slide.on_image_text === "string" ? slide.on_image_text : "",
      visual: typeof slide.visual === "string" ? slide.visual : "",
      image_prompt: typeof slide.image_prompt === "string" ? slide.image_prompt : "",
    }));

  return {
    topic: parsed.topic.trim(),
    content_type: typeof parsed.content_type === "string" ? parsed.content_type : "single_image",
    tone: typeof parsed.tone === "string" ? parsed.tone : "humorous",
    layout: typeof parsed.layout === "string" ? parsed.layout : "",
    caption: parsed.caption.trim(),
    hashtags: asStringArray(parsed.hashtags),
    slides,
  };
}

async function uploadPng(userId: string, fileName: string, bytes: Buffer): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const path = `${userId}/automation/${fileName}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: "image/png", upsert: true });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Renders and uploads every Tradeverse slide. Returns public URLs in order. */
async function renderTradeverseCarousel(
  post: TradeversePost,
  day: number,
  userId: string
): Promise<{ urls: string[]; aiArt: number; artSlots: number }> {
  const urls: string[] = [];
  const stamp = Date.now();
  let aiArt = 0;
  let artSlots = 0;

  for (const [index, slide] of post.slides.entries()) {
    const art = await generateSlideArt(slide);
    artSlots += slide.type === "cover" ? slide.items.length : 1;
    aiArt += art.filter(Boolean).length;

    const png = await renderTradeverseSlide(slide, {
      day: `${day}/${TRADEVERSE_JOURNEY_LENGTH}`,
      seed: (stamp % 1000) + index * 17,
      art,
    });

    urls.push(
      await uploadPng(userId, `${stamp}-tradeverse-day${day}-s${index + 1}.png`, png)
    );
  }

  return { urls, aiArt, artSlots };
}

async function insertDraft(row: Record<string, unknown>): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .insert({ platform: "instagram", status: "draft", ...row })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function generateForAccount(username: AutomationAccount): Promise<DraftResult> {
  const { account, brandId, error } = await findAccountByInstagramUsername(username);

  if (error || !account) {
    throw new Error(`No connected Instagram account matching "${username}" was found.`);
  }

  const recentTopics = await getRecentTopics(account.id);
  const prompt = buildAccountPrompt(username, recentTopics);
  const parsed = parseJsonObject(await AIService.generateContent(prompt));

  const base = {
    user_id: account.user_id,
    brand_id: brandId ?? null,
    social_account_id: account.id,
  };

  if (username === "tradeverse.academy") {
    const post = parseTradeversePost(parsed);
    const day = getNextTradeverseDay(recentTopics);

    let urls: string[] = [];
    let artNote = "";
    let imageError: string | null = null;

    try {
      const rendered = await renderTradeverseCarousel(post, day, account.user_id);
      urls = rendered.urls;
      artNote = !ImageGenerationService.isConfigured()
        ? "[Note: Cloudflare image generation is not configured — slides use code-drawn illustrations.]"
        : rendered.aiArt < rendered.artSlots
          ? `[Note: AI artwork succeeded for ${rendered.aiArt}/${rendered.artSlots} visuals; the rest use code-drawn illustrations.]`
          : "";
    } catch (renderError) {
      imageError = renderError instanceof Error ? renderError.message : String(renderError);
      console.error("Tradeverse slide rendering failed:", imageError);
    }

    const plan = [
      `PRODUCTION PLAN — ${post.topic}`,
      `Format: carousel | Slides: ${post.slides.length}`,
      imageError
        ? `[Automation note: slide rendering failed (${imageError}). Attach images manually before publishing.]`
        : `Rendered slides (in order):\n${urls.map((url, i) => `${i + 1}. ${url}`).join("\n")}`,
      artNote,
      post.slides.map(describeTradeverseSlide).join("\n\n"),
    ]
      .filter(Boolean)
      .join("\n\n");

    const id = await insertDraft({
      ...base,
      content_type: post.content_type,
      tone: post.tone,
      topic: post.topic,
      prompt: plan,
      generated_content: buildCaptionWithHashtags(post.caption, post.hashtags),
      image_url: urls[0] ?? null,
    });

    return {
      instagram_username: username,
      id,
      topic: post.topic,
      image_url: urls[0] ?? null,
      slide_image_urls: urls,
      brand_id: brandId ?? null,
      image_error: imageError,
    };
  }

  const post = parseCspPost(parsed);
  const format = getCspFormatForDate();
  const template = parseCspTemplate(parsed, format);

  let imageUrl: string | null = null;
  let imageError: string | null = null;
  let imageNote = "";

  if (template) {
    try {
      const png = await renderCspPost(template);
      imageUrl = await uploadPng(account.user_id, `${Date.now()}-csp.png`, png);
      imageNote = `[Image generated automatically (${template.format} format) — check the Hindi text before publishing.]`;
    } catch (renderError) {
      imageError = renderError instanceof Error ? renderError.message : String(renderError);
      console.error("CSP image rendering failed:", imageError);
      imageNote = `[Automatic image failed (${imageError}). Create it from the image prompt below and attach it via Edit → Post image.]`;
    }
  } else {
    imageNote =
      "[Gemini returned no usable template fields, so no automatic image — create it from the image prompt below and attach it via Edit → Post image.]";
  }

  const plan = [
    `PRODUCTION PLAN — ${post.topic}`,
    `Format: ${post.content_type}${post.layout ? ` | Layout: ${post.layout}` : ""} | Slides: ${post.slides.length}`,
    imageNote,
    imageUrl ? `Image: ${imageUrl}` : "",
    template ? `FORMAT: ${template.format}\nTEMPLATE TEXT:\n${JSON.stringify(template, null, 2)}` : `FORMAT: ${format}`,
    post.slides
      .map(
        (slide) =>
          `--- Slide ${slide.slide} ---\nON-IMAGE TEXT:\n${slide.on_image_text}\n\n` +
          `VISUAL:\n${slide.visual}\n\nIMAGE PROMPT (paste into ChatGPT / GPT-image):\n${slide.image_prompt}`
      )
      .join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  const id = await insertDraft({
    ...base,
    content_type: post.content_type,
    tone: post.tone,
    topic: post.topic,
    prompt: plan,
    generated_content: buildCaptionWithHashtags(post.caption, post.hashtags),
    image_url: imageUrl,
  });

  return {
    instagram_username: username,
    id,
    topic: post.topic,
    image_url: imageUrl,
    slide_image_urls: imageUrl ? [imageUrl] : [],
    brand_id: brandId ?? null,
    image_error: imageError,
  };
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = request.nextUrl.searchParams.get("account");
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
      results.push(await generateForAccount(username));
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
