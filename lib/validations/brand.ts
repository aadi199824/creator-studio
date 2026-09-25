import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z.string().max(40).optional().or(z.literal("")),
  icon: z.string().max(8).optional().or(z.literal("")),
});

export type BrandFormValues = z.infer<typeof brandSchema>;
