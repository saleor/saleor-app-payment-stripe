import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/utils";

export const paymentAppConfigEntryInternalSchema = z.object({
  configurationId: z.string().min(1),
  webhookSecret: z
    .string({ required_error: "Webhook Secret is required" })
    .min(1, { message: "Webhook Secret is required" }),
});

export const paymentAppConfigEntryEncryptedSchema = z.object({
  secretKey: z
    .string({ required_error: "Secret Key is required" })
    .min(1, { message: "Secret Key is required" }),
});

export const paymentAppConfigEntryPublicSchema = z.object({
  publishableKey: z
    .string({ required_error: "Publishable Key is required" })
    .min(1, { message: "Publishable Key is required" }),
  configurationName: z
    .string({ required_error: "Configuration name is required" })
    .min(1, { message: "Configuration name is required" }),
});

export const paymentAppConfigEntrySchema = paymentAppConfigEntryEncryptedSchema
  .merge(paymentAppConfigEntryPublicSchema)
  .merge(paymentAppConfigEntryInternalSchema);

// Entire config available to user
export const paymentAppUserVisibleConfigEntrySchema = paymentAppConfigEntryPublicSchema
  .merge(paymentAppConfigEntryEncryptedSchema)
  .merge(paymentAppConfigEntryInternalSchema)
  .strict();

// Fully configured app - all fields are required
// Zod doesn't have a utility for marking fields as non-nullable, we need to use unwrap
export const paymentAppFullyConfiguredEntrySchema = z
  .object({
    configurationName: paymentAppConfigEntryPublicSchema.shape.configurationName,
    configurationId: paymentAppConfigEntryInternalSchema.shape.configurationId,
    secretKey: paymentAppConfigEntryEncryptedSchema.shape.secretKey,
    publishableKey: paymentAppConfigEntryPublicSchema.shape.publishableKey,
    webhookSecret: paymentAppConfigEntryInternalSchema.shape.webhookSecret,
  })
  .required();

// Schema used as input validation for saving config entires
export const paymentAppFormConfigEntrySchema = paymentAppConfigEntryEncryptedSchema
  .merge(paymentAppConfigEntryPublicSchema)
  .strict()
  .default({
    secretKey: "",
    publishableKey: "",
    configurationName: "",
  });

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
