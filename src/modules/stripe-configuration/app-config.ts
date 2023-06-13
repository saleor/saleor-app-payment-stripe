import { z } from "zod";
import { stripeFullyConfiguredEntrySchema } from "./stripe-entries-config";

export const stripeConfigEntriesSchema = stripeFullyConfiguredEntrySchema.array();

// Record<ChannelID, StripeConfigEntryId>
export const channelMappingSchema = z
  .record(z.string().min(1), z.string().min(1).nullable())
  .default({});

export const stripeAppConfigSchema = z
  .object({
    configurations: stripeConfigEntriesSchema,
    channelToConfigurationId: channelMappingSchema,
  })
  .default({
    configurations: [],
    channelToConfigurationId: {},
  });

export type StripeConfigEntries = z.infer<typeof stripeConfigEntriesSchema>;
export type ChannelMapping = z.infer<typeof channelMappingSchema>;
export type StripeAppConfig = z.infer<typeof stripeAppConfigSchema>;
