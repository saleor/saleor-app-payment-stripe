import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/utils";

export const DANGEROUS_paymentAppConfigEntryHiddenSchema = z.object({
  webhookPassword: z.string().min(1).nullish(),
});

export const paymentAppConfigEntryInternalSchema = z.object({
  configurationId: z.string().min(1),
  apiKeyId: z.string().nullish(),
});

export const paymentAppConfigEntryEncryptedSchema = z.object({
  apiKey: z.string({ required_error: "Private API key is required" }).min(1).nullable(),
});

export const paymentAppConfigEntryPublicSchema = z.object({
  clientKey: z.string().min(1).nullish(),
  configurationName: z.string().min(1),
});

export const paymentAppConfigEntrySchema = paymentAppConfigEntryInternalSchema
  .merge(paymentAppConfigEntryEncryptedSchema)
  .merge(paymentAppConfigEntryPublicSchema)
  .merge(DANGEROUS_paymentAppConfigEntryHiddenSchema);

// Entire config available to user
export const paymentAppUserVisibleConfigEntrySchema = paymentAppConfigEntryPublicSchema
  .merge(paymentAppConfigEntryInternalSchema)
  .merge(paymentAppConfigEntryEncryptedSchema)
  .strict();

// Fully configured app - all fields are required
// Zod doesn't have a utility for marking fields as non-nullable, we need to use unwrap
export const paymentAppFullyConfiguredEntrySchema = z
  .object({
    configurationName: paymentAppConfigEntryPublicSchema.shape.configurationName,
    configurationId: paymentAppConfigEntryInternalSchema.shape.configurationId,
    apiKey: paymentAppConfigEntryEncryptedSchema.shape.apiKey.unwrap(),
    apiKeyId: paymentAppConfigEntryInternalSchema.shape.apiKeyId.unwrap().unwrap(),
    clientKey: paymentAppConfigEntryPublicSchema.shape.clientKey.unwrap().unwrap(),
    webhookPassword: DANGEROUS_paymentAppConfigEntryHiddenSchema.shape.webhookPassword
      .unwrap()
      .unwrap(),
  })
  .required();

// Schema used as input validation for saving config entires
export const paymentAppFormConfigEntrySchema = paymentAppConfigEntryEncryptedSchema
  .merge(paymentAppConfigEntryPublicSchema)
  .strict()
  .default({
    apiKey: null,
    clientKey: null,
    configurationName: "",
  })
  .brand("PaymentAppFormConfig");

/** Schema used in front-end forms
 * Replaces obfuscated values with null */
export const paymentAppEncryptedFormSchema = paymentAppConfigEntryEncryptedSchema.transform(
  (values) => deobfuscateValues(values),
);

// Schema used for front-end forms
export const paymentAppCombinedFormSchema = z.intersection(
  paymentAppEncryptedFormSchema,
  paymentAppConfigEntryPublicSchema,
);

export type PaymentAppHiddenConfig = z.infer<typeof DANGEROUS_paymentAppConfigEntryHiddenSchema>;
export type PaymentAppInternalConfig = z.infer<typeof paymentAppConfigEntryInternalSchema>;
export type PaymentAppEncryptedConfig = z.infer<typeof paymentAppConfigEntryEncryptedSchema>;
export type PaymentAppPublicConfig = z.infer<typeof paymentAppConfigEntryPublicSchema>;

export type PaymentAppConfigEntry = z.infer<typeof paymentAppConfigEntrySchema>;
export type PaymentAppConfigEntryFullyConfigured = z.infer<
  typeof paymentAppFullyConfiguredEntrySchema
>;
export type PaymentAppUserVisibleConfigEntry = z.infer<
  typeof paymentAppUserVisibleConfigEntrySchema
>;
export type PaymentAppFormConfigEntry = z.infer<typeof paymentAppFormConfigEntrySchema>;
