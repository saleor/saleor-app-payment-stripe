import { obfuscateConfig } from "../app-configuration/utils";
import {
  type PaymentAppConfigEntry,
  type PaymentAppEncryptedConfig,
  type PaymentAppUserVisibleConfigEntry,
  paymentAppUserVisibleConfigEntrySchema,
} from "./config-entry";

export const obfuscateConfigEntry = (
  entry: PaymentAppConfigEntry,
): PaymentAppUserVisibleConfigEntry => {
  const { secretKey, webhookSecret, publishableKey, configurationName, configurationId } = entry;

  const configValuesToObfuscate = {
    secretKey,
    webhookSecret,
  } satisfies PaymentAppEncryptedConfig;

  return paymentAppUserVisibleConfigEntrySchema.parse({
    publishableKey,
    configurationId,
    configurationName,
    ...obfuscateConfig(configValuesToObfuscate),
  } satisfies PaymentAppUserVisibleConfigEntry);
};
