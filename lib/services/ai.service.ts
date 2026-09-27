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
    message.includes("Service Unavailable")
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

  static async generateImage(prompt: string) {
    return withRetry(async () => {
      // ROOT CAUSE (fixed here): the Gemini Interactions API defaults to a
      // text-only response unless the caller explicitly asks for an image
      // via `response_modalities`. Without this, `interaction.output_image`
      // is always undefined — not an error, not a transient failure, just a
      // text-only response every single time — which is exactly what
      // produced a consistent (not intermittent) `image_url: null` in
      // production. See @google/genai's genai.d.ts:
      // CreateModelInteraction.response_modalities: Array<ResponseModality>
      // where ResponseModality includes "image".
      let interaction;

      try {
        interaction = await ai.interactions.create({
          model: "gemini-2.5-flash-image",
          input: prompt,
          response_modalities: ["image"],
        });
      } catch (error) {
        throw new Error(
          `Gemini image request failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      const image = interaction.output_image;

      if (!image) {
        throw new Error(
          "Gemini image response did not include an output_image block (response_modalities may not have been honored, or the prompt was blocked by safety filters)."
        );
      }

      if (!image.data) {
        throw new Error(
          "Gemini output_image block was present but had no base64 `data` (it may have returned a `uri` instead, which this integration does not yet handle)."
        );
      }

      const mimeType = image.mime_type || "image/png";

      return {
        bytes: Buffer.from(image.data, "base64"),
        mimeType,
      };
    });
  }
}
