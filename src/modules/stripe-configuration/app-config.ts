import { z } from "zod";
import { adyenConfigEntry, adyenUserVisibleEntryConfig } from "./stripe-entries-config";

export const adyenConfigEntriesSchema = adyenConfigEntry.array();
export const adyenUserVisibleConfigEntriesSchema = adyenUserVisibleEntryConfig.array();

// Record<ChannelID, AdyenConfigEntryId>
export const channelMappingSchema = z
  .record(z.string().min(1), z.string().min(1).nullable())
  .default({});

export const adyenAppConfigSchema = z
  .object({
    configurations: adyenConfigEntriesSchema,
    channelToConfigurationId: channelMappingSchema,
  })
  .default({
    configurations: [],
    channelToConfigurationId: {},
  });

export const adyenAppUserVisibleConfigSchema = z
  .object({
    configurations: adyenUserVisibleConfigEntriesSchema,
    channelToConfigurationId: channelMappingSchema,
  })
  .default({
    configurations: [],
    channelToConfigurationId: {},
  });

export type AdyenConfigEntries = z.infer<typeof adyenConfigEntriesSchema>;
export type ChannelMapping = z.infer<typeof channelMappingSchema>;
export type AdyenAppConfig = z.infer<typeof adyenAppConfigSchema>;
export type AdyenUserVisibleAppConfig = z.infer<typeof adyenAppUserVisibleConfigSchema>;
