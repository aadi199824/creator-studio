import { z } from "zod";

export const contentSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),

  platform: z.string().min(1),

  content_type: z.string().min(1),

  tone: z.string().min(1),

  status: z.string().min(1),

  prompt: z.string().min(10),
});

export type ContentFormValues = z.infer<typeof contentSchema>;