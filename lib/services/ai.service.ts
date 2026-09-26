import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export class AIService {
  static async generateContent(prompt: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      return response.text ?? "";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  /**
   * Generates a single image from a text prompt using Gemini's image model
   * (gemini-2.5-flash-image, per ai.google.dev/gemini-api/docs as of this
   * writing). Returns raw image bytes + mime type so callers can upload them
   * wherever they need (Supabase Storage, etc.) without this service caring
   * about storage concerns.
   */
  static async generateImage(
    prompt: string
  ): Promise<{ bytes: Buffer; mimeType: string }> {
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-2.5-flash-image",
        input: prompt,
      });

      const image = interaction.output_image;

      if (!image?.data) {
        throw new Error("Gemini did not return an image for this prompt.");
      }

      return {
        bytes: Buffer.from(image.data, "base64"),
        mimeType: image.mime_type || "image/png",
      };
    } catch (error) {
      console.error("Gemini image generation error:", error);
      throw error;
    }
  }
}
