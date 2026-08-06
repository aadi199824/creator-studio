import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export class AIService {
  static async generateContent(prompt: string) {
    try {
      console.log("Gemini Key:", process.env.GEMINI_API_KEY?.substring(0, 10));

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      console.log("FULL RESPONSE:");
      console.dir(response, { depth: null });

      return response.text ?? "";
    } catch (err) {
      console.error("Gemini Error:", err);
      throw err;
    }
  }
}