import { z } from "zod";

export const dailyDraftSchema = z.object({
  instagram_username: z.string().min(1),
  content_type: z.string().min(1),
  tone: z.string().min(1),
  topic: z.string().min(1),
  prompt_summary: z.string().min(1),
  post_text: z.string().min(1),
  image_prompt: z.string().min(1),
  sources: z.array(z.string()).optional(),
});

export type DailyDraftInput = z.infer<typeof dailyDraftSchema>;
