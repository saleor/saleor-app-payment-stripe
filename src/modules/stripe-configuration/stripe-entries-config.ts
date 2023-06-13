import { z } from "zod";

// Entry values that are set by Adyen API, not editable by users
export const stripeFullyConfiguredEntrySchema = z.object({
  configurationId: z.string().uuid(),
  publishableKey: z.string().min(1),
  secretKey: z.string().min(1),
});
export type StripeEntryFullyConfigured = z.infer<typeof stripeFullyConfiguredEntrySchema>;
