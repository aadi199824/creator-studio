/**
 * Text-free slide artwork from Cloudflare Workers AI (FLUX.1 [schnell]).
 *
 * Only the picture is AI-generated. All words, the logo and the layout are
 * drawn by code in lib/render/tradeverse-slides.tsx, so text is always sharp
 * and correctly spelled.
 *
 * Env:
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_AI_API_TOKEN  (API token with Workers AI permission)
 * - CLOUDFLARE_IMAGE_MODEL   (optional, default @cf/black-forest-labs/flux-1-schnell)
 *
 * Free tier: 10,000 neurons/day. Cloudflare prices flux-1-schnell at 4.8
 * neurons per 512×512 tile + 9.6 per step, so one 1024×1024 image at 8 steps
 * is roughly 100 neurons — a daily carousel (~10 images) is well inside it.
 *
 * Any failure returns null and the slide falls back to its code-drawn
 * illustration, so artwork problems never block a draft.

 */

const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const REQUEST_TIMEOUT_MS = 60_000;
const STEPS = 8; // schnell maximum — best quality the model offers

type CloudflareAiResponse = {
  success?: boolean;
  result?: { image?: string };
  image?: string;
  errors?: { message?: string }[];
};

export class ImageGenerationService {
  static isConfigured(): boolean {
    return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_API_TOKEN);
  }

  /** Returns a JPEG data URL, or null if not configured / generation failed. */
  static async generate(prompt: string): Promise<string | null> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_AI_API_TOKEN;
    if (!accountId || !token || !prompt.trim()) return null;

    const model = process.env.CLOUDFLARE_IMAGE_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Only `prompt` and `steps` — flux-1-schnell rejects any other
          // property (e.g. `seed`) with "Additional or unevaluated properties".
          body: JSON.stringify({
            prompt: prompt.slice(0, 2048),
            steps: STEPS,
          }),
          signal: controller.signal,
        }
      );

      const body = (await response.json().catch(() => null)) as CloudflareAiResponse | null;
      const image = body?.result?.image ?? body?.image;

      if (!response.ok || !image) {
        const reason = body?.errors?.map((error) => error.message).join("; ") || `HTTP ${response.status}`;
        console.warn(`Cloudflare image generation failed: ${reason}`);
        return null;
      }

      return `data:image/jpeg;base64,${image}`;
    } catch (error) {
      console.warn(
        "Cloudflare image generation failed:",
        error instanceof Error ? error.message : "unknown error"
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

}

/** Accent name used in prompts so the artwork's glow matches the slide colour. */
const ACCENT_WORDS: Record<string, string> = {
  cyan: "electric blue",
  orange: "warm orange",
  green: "emerald green",
  purple: "violet purple",
  gold: "golden amber",
};

/**
 * Fixed house style wrapped around every subject, so all artwork looks like
 * one series (the 3D-object look of the live ChatGPT posts + the
 * competitor's cinematic glow and reflective floor).
 */
export function tradeverseArtPrompt(subject: string, accent: string): string {
  const glow = ACCENT_WORDS[accent] ?? "golden amber";
  return (
    `${subject.trim().replace(/\.$/, "")}. ` +
    `Premium glossy 3D render, realistic materials, single centered subject filling most of the frame, ` +
    `dramatic ${glow} rim light and soft ${glow} glow, subtle reflective dark floor, ` +
    `pure black background, cinematic studio lighting, ultra sharp, high detail, square composition. ` +
    `Absolutely no text, no letters, no numbers, no logos, no watermark, no UI labels.`
  );
}
