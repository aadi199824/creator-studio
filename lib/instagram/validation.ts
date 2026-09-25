import { z } from "zod";

export const instagramPublishSchema = z.object({
  accountId: z.string().uuid("A valid Instagram account must be selected"),
  imageUrl: z.string().url("A valid image URL is required"),
  caption: z.string().max(2200).optional().default(""),
});

export type InstagramPublishInput = z.infer<typeof instagramPublishSchema>;
