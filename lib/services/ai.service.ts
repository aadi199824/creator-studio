import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Gemini returns 503 "high demand" during traffic spikes. Instead of
// waiting on one overloaded model, try a chain of models, each with a few
// backed-off retries (whole chain stays well inside the 300s route budget).
//
// Model IDs from Google's model/deprecation page (checked 2026-10-20):
// gemini-3.8-flash and gemini-3.5-flash-lite are the recommended current
// models; gemini-3.5-flash (the old default) now routes to 3.6-flash.
// Override with GEMINI_TEXT_MODEL / GEMINI_FALLBACK_MODEL if needed.
const RETRY_DELAYS = [3000, 8000, 15000];

const MODEL_CHAIN = [
  process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
].filter((model, index, all) => model && all.indexOf(model) === index);

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

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_DELAYS.length + 1
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = RETRY_DELAYS[attempt] ?? 15000;

      console.warn(
        `AI request failed with a temporary error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/** Model missing / not enabled for this key — move on to the next model. */
function isModelUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("404") || message.includes("NOT_FOUND") || message.includes("is not found");
}

async function generateWith(model: string, prompt: string): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text ?? "";
  });
}

export class AIService {
  static async generateContent(prompt: string) {
    let lastError: unknown;

    for (const model of MODEL_CHAIN) {
      try {
        return await generateWith(model, prompt);
      } catch (error) {
        lastError = error;
        if (!isRetryableError(error) && !isModelUnavailableError(error)) throw error;
        console.warn(
          `Gemini model ${model} unavailable (${error instanceof Error ? error.message.slice(0, 120) : "error"}); trying next model.`
        );
      }
    }

    throw lastError;
  }
}
