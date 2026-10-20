import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Gemini returns 503 "high demand" during traffic spikes, sometimes for a
// minute or more. Back off progressively (~90s total) before giving up —
// well inside the 300s budget of the daily automation routes.
const MAX_RETRIES = 6;
const RETRY_DELAYS = [3000, 8000, 15000, 25000, 40000];

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash";
// Optional second model tried once if the primary is still overloaded after
// all retries. Set it to any text model your key can use; unset = disabled.
const FALLBACK_TEXT_MODEL = process.env.GEMINI_FALLBACK_MODEL || "";

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
  maxRetries: number = MAX_RETRIES
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

      const delay = RETRY_DELAYS[attempt] ?? 5000;

      console.warn(
        `AI request failed with a temporary error (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

async function generateWith(model: string, prompt: string, maxRetries?: number): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text ?? "";
  }, maxRetries);
}

export class AIService {
  static async generateContent(prompt: string) {
    try {
      return await generateWith(TEXT_MODEL, prompt);
    } catch (error) {
      if (!FALLBACK_TEXT_MODEL || !isRetryableError(error)) throw error;

      console.warn(`${TEXT_MODEL} still overloaded; trying fallback model ${FALLBACK_TEXT_MODEL}.`);
      return generateWith(FALLBACK_TEXT_MODEL, prompt, 3);
    }
  }
}
