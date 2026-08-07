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
}