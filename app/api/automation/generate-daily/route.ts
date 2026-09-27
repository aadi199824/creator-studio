import { NextRequest, NextResponse } from "next/server";

import { AIService } from "@/lib/services/ai.service";
import {
  findAccountByInstagramUsername,
} from "@/lib/services/automation.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const ACCOUNTS = [
  "csp_officials",
  "tradeverse.academy",
] as const;

type GeneratedPost = {
  topic: string;
  content_type: string;
  tone: string;
  post_text: string;
  image_prompt: string;
  sources?: string[];
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
    typeof parsed.post_text !== "string" ||
    typeof parsed.image_prompt !== "string"
  ) {
    throw new Error("Gemini returned an invalid daily-post structure.");
  }

  return {
    topic: parsed.topic,
    content_type: parsed.content_type,
    tone: parsed.tone,
    post_text: parsed.post_text,
    image_prompt: parsed.image_prompt,
    sources: Array.isArray(parsed.sources)
      ? parsed.sources.filter(
          (source: unknown): source is string =>
            typeof source === "string"
        )
      : [],
  };
}

function buildPrompt(
  username: string,
  recentTopics: string[]
): string {
  const recentTopicsText =
    recentTopics.length > 0
      ? recentTopics.map((topic) => `- ${topic}`).join("\n")
      : "- No previous topics available.";

  if (username === "csp_officials") {
    return `
You are the content strategist for the Instagram account @csp_officials.

ACCOUNT POSITIONING:
Professional career and government-exam content for aspirants, working professionals,
and corporate employees.

The account is NOT a generic government-job-news spam account.

CONTENT STYLE:
- Professional
- Credible
- Useful
- Concise
- Career-focused
- Information-first

PREFERRED TOPICS:
- Government recruitment updates
- PSU opportunities
- Competitive examinations
- Official notifications
- Application dates
- Eligibility
- Preparation guidance
- Career opportunities
- Exam strategy
- Important official changes

CRITICAL FACTUAL RULE:
Never invent vacancies, dates, eligibility, age limits, salary, deadlines,
exam dates, selection processes, qualification requirements, or other recruitment facts.

For current/recent recruitment information, use reliable official government,
PSU, examination-body, or recruitment-authority sources whenever possible.

If current information cannot be reliably verified, choose an evergreen educational
or preparation topic instead of inventing current facts.

CONTENT STRUCTURE:
Hook → important information → key details → who it matters to →
practical takeaway → CTA.

VISUAL STYLE:
Professional Indian career/education.
Clean corporate-academic.
Modern and trustworthy.
Portrait 4:5.
Do not create fake government documents, fake certificates, fake screenshots,
or fake official logos.

RECENT TOPICS:
${recentTopicsText}

Do not repeat a recent topic unless there is a clearly different educational angle.

Return ONLY valid JSON using exactly this structure:

{
  "topic": "short topic name",
  "content_type": "carousel",
  "tone": "professional",
  "post_text": "complete Instagram-ready post",
  "image_prompt": "complete image-generation prompt",
  "sources": ["official source URL 1", "official source URL 2"]
}
`;
  }

  return `
You are the content strategist for @tradeverse.academy.

ACCOUNT PURPOSE:
A structured 30-day trading education journey.

This is NOT random disconnected trading content.

The content should continue logically from previous lessons and avoid repeating
topics unless revision or an advanced explanation is intentional.

STYLE:
- Teacher/mentor
- Simple
- Practical
- Beginner-friendly
- Structured
- Educational

EXPLAIN:
- What the concept is
- Why it matters
- How it works
- A practical example
- Common mistakes
- A practical rule/checklist
- Key takeaway

FORMAT:
Prefer an educational Instagram carousel.
Typical structure:
1. Hook
2. Concept
3. Explanation
4. Example
5. Common mistake
6. Practical rule/checklist
7. Key takeaway
8. Save/follow CTA

SAFETY:
Never promise guaranteed profit.
Never claim 100% accuracy.
Never claim guaranteed income.
Never claim risk-free trading.
Do not provide personalized buy/sell recommendations.
Examples must be educational.
Include an appropriate educational/risk disclaimer where useful.

VISUAL STYLE:
Premium trading education.
Modern financial aesthetic.
Analytical.
Clean and professional.
Charts, notebook, calculator, candlesticks, market structure,
or risk-management diagrams are appropriate.

Avoid:
- Luxury cars
- Cash piles
- Fake P&L screenshots
- Get-rich-quick imagery

RECENT TOPICS:
${recentTopicsText}

Continue the learning journey logically from these topics.
Do not simply repeat one of them.

Return ONLY valid JSON using exactly this structure:

{
  "topic": "short topic name",
  "content_type": "carousel",
  "tone": "educational",
  "post_text": "complete Instagram-ready carousel content and caption",
  "image_prompt": "complete image-generation prompt",
  "sources": []
}
`;
}

async function generateForAccount(username: string) {
  const { account, brandId, error } =
    await findAccountByInstagramUsername(username);

  if (error || !account) {
    throw new Error(
      `No connected Instagram account matching "${username}" was found.`
    );
  }

  const recentTopics = await getRecentTopics(account.user_id);

  const prompt = buildPrompt(username, recentTopics);

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
      "\n\n[Automation note: image generation failed. Please attach an image manually before publishing.]";
  }

  const generatedContent =
    post.post_text +
    imageNote +
    (post.sources && post.sources.length > 0
      ? `\n\nSources:\n${post.sources
          .map((source) => `- ${source}`)
          .join("\n")}`
      : "");

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
      prompt: prompt,
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

  for (const username of ACCOUNTS) {
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
