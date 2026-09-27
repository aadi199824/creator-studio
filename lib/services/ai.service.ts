import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000];

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("Service Unavailable") ||
    message.includes("timed out") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNRESET")
  );
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === MAX_RETRIES - 1) {
        throw error;
      }

      const delay = RETRY_DELAYS[attempt] ?? 5000;

      console.warn(
        `AI request failed with a temporary error. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// pollinations.ai — free, unauthenticated text-to-image API. Used here
// instead of Gemini/Imagen because Google currently has ZERO free-tier
// quota for any image-generation model (confirmed directly against
// ai.google.dev/gemini-api/docs/pricing: every image-capable model shows
// "Not available" on the free tier — this isn't a rate limit that resets,
// it's a hard 0 allowance). Gemini text generation is untouched and still
// used for all text content.
const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";
const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 1280; // ~4:5 portrait, matches both brands' visual specs
const IMAGE_REQUEST_TIMEOUT_MS = 60_000;

export class AIService {
  static async generateContent(prompt: string) {
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return response.text ?? "";
    });
  }

  static async generateImage(
    prompt: string
  ): Promise<{ bytes: Buffer; mimeType: string }> {
    return withRetry(async () => {
      const url =
        `${POLLINATIONS_BASE_URL}/${encodeURIComponent(prompt)}` +
        `?width=${IMAGE_WIDTH}&height=${IMAGE_HEIGHT}&nologo=true`;

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        IMAGE_REQUEST_TIMEOUT_MS
      );

      let response: Response;

      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (error) {
        throw new Error(
          `Image request to pollinations.ai failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(
          `pollinations.ai returned ${response.status} ${response.statusText} for this image prompt.`
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        throw new Error(
          "pollinations.ai returned a 200 response with an empty body (no image data)."
        );
      }

      const mimeType = response.headers.get("content-type") || "image/jpeg";

      return {
        bytes: Buffer.from(arrayBuffer),
        mimeType,
      };
    });
  }
}
