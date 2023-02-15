import { z } from "zod";
import { deobfuscateValues } from "../app-configuration/app-configuration";

export const paymentProviderSchema = z.object({
  fakeApiKey: z.string({ required_error: "API key is required" }).nullable(),
});

/** Schema used in front-end forms
 * Replaces obfuscated values with null */
export const paymentProviderFormSchema = paymentProviderSchema.transform((values) =>
  deobfuscateValues(values),
);

export type PaymentProviderConfig = z.infer<typeof paymentProviderSchema>;

export const defaultPaymentProviderConfig: PaymentProviderConfig = {
  fakeApiKey: "",
};
