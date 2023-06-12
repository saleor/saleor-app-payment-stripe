import { z } from "zod";
import { adyenUpdateEntryInputSchema } from "./stripe-entries-config";

export const mappingUpdate = z.object({
  channelId: z.string().min(1),
  configurationId: z.string().min(1),
});

export const adyenConfigEntryUpdate = z.object({
  configurationId: z.string().min(1),
  entry: adyenUpdateEntryInputSchema,
});

export const adyenConfigEntryDelete = z.object({ configurationId: z.string().min(1) });

export type MappingUpdate = z.infer<typeof mappingUpdate>;
export type AdyenConfigEntryUpdate = z.infer<typeof adyenConfigEntryUpdate>;
export type AdyenConfigEntryDelete = z.infer<typeof adyenConfigEntryDelete>;
