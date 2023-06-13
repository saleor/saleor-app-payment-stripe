import { z } from "zod";
import { stripeFullyConfiguredEntrySchema } from "./stripe-entries-config";

export const mappingUpdate = z.object({
  channelId: z.string().min(1),
  configurationId: z.string().min(1),
});

export const stripeConfigEntryUpdate = z.object({
  configurationId: z.string().min(1),
  entry: stripeFullyConfiguredEntrySchema,
});

export const stripeConfigEntryDelete = z.object({ configurationId: z.string().min(1) });

export type MappingUpdate = z.infer<typeof mappingUpdate>;
export type StripeConfigEntryUpdate = z.infer<typeof stripeConfigEntryUpdate>;
export type StripeConfigEntryDelete = z.infer<typeof stripeConfigEntryDelete>;
