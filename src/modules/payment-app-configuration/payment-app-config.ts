import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/utils";

export const paymentAppInternalConfigSchema = z.object({
  apiKeyId: z.string().nullish(),
});

export const paymentAppEncryptedConfigSchema = z.object({
  apiKey: z.string({ required_error: "Private API key is required" }).min(1).nullable(),
});

export const paymentAppPublicConfigSchema = z.object({
  clientKey: z.string().min(1).nullish(),
});

export const paymentAppCombinedSchema = paymentAppInternalConfigSchema
  .merge(paymentAppEncryptedConfigSchema)
  .merge(paymentAppPublicConfigSchema)
  .default({
    apiKey: null,
    apiKeyId: null,
    clientKey: null,
  });

// Zod doesn't have a utility for marking fields as non-nullable, we need to use unwrap
export const paymentAppFullyConfiguredSchema = z
  .object({
    apiKey: paymentAppEncryptedConfigSchema.shape.apiKey.unwrap(),
    apiKeyId: paymentAppInternalConfigSchema.shape.apiKeyId.unwrap().unwrap(),
    clientKey: paymentAppPublicConfigSchema.shape.clientKey.unwrap().unwrap(),
  })
  .required();

export const paymentAppFormConfigSchema = paymentAppEncryptedConfigSchema
  .merge(paymentAppPublicConfigSchema)
  .strict()
  .default({
    apiKey: null,
    clientKey: null,
  })
  .brand("PaymentAppFormConfig");

/** Schema used in front-end forms
 * Replaces obfuscated values with null */
export const paymentAppEncryptedFormSchema = paymentAppEncryptedConfigSchema.transform((values) =>
  deobfuscateValues(values),
);

export const paymentAppCombinedFormSchema = z.intersection(
  paymentAppEncryptedFormSchema,
  paymentAppPublicConfigSchema,
);

export type PaymentAppInternalConfig = z.infer<typeof paymentAppInternalConfigSchema>;
export type PaymentAppEncryptedConfig = z.infer<typeof paymentAppEncryptedConfigSchema>;
export type PaymentAppPublicConfig = z.infer<typeof paymentAppPublicConfigSchema>;

export type PaymentAppConfig = z.infer<typeof paymentAppCombinedSchema>;
export type PaymentAppConfigFullyConfigured = z.infer<typeof paymentAppFullyConfiguredSchema>;
export type PaymentAppFormConfig = z.infer<typeof paymentAppFormConfigSchema>;

export const defaultPaymentAppConfig: PaymentAppConfig = paymentAppCombinedSchema.parse(undefined);
export const defaultPaymentAppFormConfig: PaymentAppFormConfig =
  paymentAppFormConfigSchema.parse(undefined);
