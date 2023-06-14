import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/utils";

export const paymentAppConfigEntryInternalSchema = z.object({
  configurationId: z.string().min(1),
});

export const paymentAppConfigEntryEncryptedSchema = z.object({
  secretKey: z.string({ required_error: "Secret key is required" }).min(1).nullable(),
});

export const paymentAppConfigEntryPublicSchema = z.object({
  publishableKey: z.string().min(1).nullish(),
  configurationName: z.string().min(1),
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
    secretKey: paymentAppConfigEntryEncryptedSchema.shape.secretKey.unwrap(),
    publishableKey: paymentAppConfigEntryPublicSchema.shape.publishableKey.unwrap().unwrap(),
  })
  .required();

// Schema used as input validation for saving config entires
export const paymentAppFormConfigEntrySchema = paymentAppConfigEntryEncryptedSchema
  .merge(paymentAppConfigEntryPublicSchema)
  .strict()
  .default({
    secretKey: null,
    publishableKey: null,
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
